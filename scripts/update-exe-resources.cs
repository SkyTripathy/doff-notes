using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Diagnostics;

namespace ExeUpdater
{
    class Program
    {
        [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
        static extern IntPtr BeginUpdateResource(string pFileName, bool bDeleteExistingResources);

        [DllImport("kernel32.dll", SetLastError = true)]
        static extern bool UpdateResource(IntPtr hUpdate, IntPtr lpType, IntPtr lpName, ushort wLanguage, byte[] lpData, uint cbData);

        [DllImport("kernel32.dll", SetLastError = true)]
        static extern bool EndUpdateResource(IntPtr hUpdate, bool fDiscard);

        [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
        static extern IntPtr LoadLibraryEx(string lpLibFileName, IntPtr hFile, uint dwFlags);

        [DllImport("kernel32.dll", SetLastError = true)]
        static extern IntPtr FindResource(IntPtr hModule, IntPtr lpName, IntPtr lpType);

        [DllImport("kernel32.dll", SetLastError = true)]
        static extern IntPtr LoadResource(IntPtr hModule, IntPtr hResInfo);

        [DllImport("kernel32.dll", SetLastError = true)]
        static extern IntPtr LockResource(IntPtr hResData);

        [DllImport("kernel32.dll", SetLastError = true)]
        static extern uint SizeofResource(IntPtr hModule, IntPtr hResInfo);

        [DllImport("kernel32.dll", SetLastError = true)]
        static extern bool FreeLibrary(IntPtr hModule);

        const uint LOAD_LIBRARY_AS_DATAFILE = 0x00000002;
        static readonly IntPtr RT_ICON = (IntPtr)3;
        static readonly IntPtr RT_GROUP_ICON = (IntPtr)14;
        static readonly IntPtr RT_VERSION = (IntPtr)16;

        static int Main(string[] args)
        {
            if (args.Length < 2)
            {
                Console.WriteLine("Usage: UpdateExe.exe <target.exe> <icon.ico>");
                return 1;
            }

            string targetExe = Path.GetFullPath(args[0]);
            string iconFile = Path.GetFullPath(args[1]);

            if (!File.Exists(targetExe))
            {
                Console.WriteLine("Error: Target exe not found: " + targetExe);
                return 1;
            }
            if (!File.Exists(iconFile))
            {
                Console.WriteLine("Error: Icon file not found: " + iconFile);
                return 1;
            }

            Console.WriteLine("Updating resources for: " + targetExe);

            // Step 1: Generate clean Version Info assembly
            string tempDir = Path.GetDirectoryName(targetExe);
            string dummyCs = Path.Combine(tempDir, "temp_ver.cs");
            string dummyExe = Path.Combine(tempDir, "temp_ver.exe");

            string csharpCode = @"
using System.Reflection;
[assembly: AssemblyTitle(""Doff Notes"")]
[assembly: AssemblyProduct(""Doff Notes"")]
[assembly: AssemblyDescription(""Doff Notes"")]
[assembly: AssemblyCompany(""Doff Notes"")]
[assembly: AssemblyCopyright(""Copyright (C) 2026 Doff Notes"")]
[assembly: AssemblyFileVersion(""1.0.0.0"")]
[assembly: AssemblyInformationalVersion(""1.0.0"")]
class P { static void Main() {} }
";
            File.WriteAllText(dummyCs, csharpCode);

            Process cscProc = new Process();
            cscProc.StartInfo.FileName = @"C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe";
            cscProc.StartInfo.Arguments = "/target:winexe /out:\"" + dummyExe + "\" \"" + dummyCs + "\"";
            cscProc.StartInfo.UseShellExecute = false;
            cscProc.StartInfo.CreateNoWindow = true;
            cscProc.Start();
            cscProc.WaitForExit();

            byte[] versionBytes = null;
            if (File.Exists(dummyExe))
            {
                IntPtr hMod = LoadLibraryEx(dummyExe, IntPtr.Zero, LOAD_LIBRARY_AS_DATAFILE);
                if (hMod != IntPtr.Zero)
                {
                    IntPtr hRes = FindResource(hMod, (IntPtr)1, RT_VERSION);
                    if (hRes != IntPtr.Zero)
                    {
                        uint size = SizeofResource(hMod, hRes);
                        IntPtr hGlobal = LoadResource(hMod, hRes);
                        if (hGlobal != IntPtr.Zero)
                        {
                            IntPtr ptr = LockResource(hGlobal);
                            if (ptr != IntPtr.Zero)
                            {
                                versionBytes = new byte[size];
                                Marshal.Copy(ptr, versionBytes, 0, (int)size);
                            }
                        }
                    }
                    FreeLibrary(hMod);
                }
                try { File.Delete(dummyExe); } catch {}
            }
            try { File.Delete(dummyCs); } catch {}

            // Step 2: Open target exe for resource updating
            IntPtr hUpdate = BeginUpdateResource(targetExe, false);
            if (hUpdate == IntPtr.Zero)
            {
                Console.WriteLine("Error: BeginUpdateResource failed. Error: " + Marshal.GetLastWin32Error());
                return 1;
            }

            // Step 3: Inject Version Info
            if (versionBytes != null)
            {
                Console.WriteLine("Writing VersionInfo (ProductName=Doff Notes, FileDescription=Doff Notes)...");
                UpdateResource(hUpdate, RT_VERSION, (IntPtr)1, 0, versionBytes, (uint)versionBytes.Length);
                UpdateResource(hUpdate, RT_VERSION, (IntPtr)1, 1033, versionBytes, (uint)versionBytes.Length);
            }

            // Step 4: Parse .ico and Inject RT_ICON and RT_GROUP_ICON
            Console.WriteLine("Reading icon: " + iconFile);
            byte[] icoBytes = File.ReadAllBytes(iconFile);
            using (BinaryReader reader = new BinaryReader(new MemoryStream(icoBytes)))
            {
                ushort idReserved = reader.ReadUInt16();
                ushort idType = reader.ReadUInt16();
                ushort idCount = reader.ReadUInt16();

                if (idType == 1 && idCount > 0)
                {
                    Console.WriteLine("Found " + idCount + " icon images in .ico. Injecting...");

                    // Memory stream for GRPICONDIR
                    using (MemoryStream grpStream = new MemoryStream())
                    using (BinaryWriter grpWriter = new BinaryWriter(grpStream))
                    {
                        grpWriter.Write(idReserved);
                        grpWriter.Write(idType);
                        grpWriter.Write(idCount);

                        // Read all ICONDIRENTRYs first
                        long dirEntriesOffset = 6;
                        for (ushort i = 0; i < idCount; i++)
                        {
                            reader.BaseStream.Seek(dirEntriesOffset + (i * 16), SeekOrigin.Begin);
                            byte bWidth = reader.ReadByte();
                            byte bHeight = reader.ReadByte();
                            byte bColorCount = reader.ReadByte();
                            byte bReserved = reader.ReadByte();
                            ushort wPlanes = reader.ReadUInt16();
                            ushort wBitCount = reader.ReadUInt16();
                            uint dwBytesInRes = reader.ReadUInt32();
                            uint dwImageOffset = reader.ReadUInt32();

                            ushort resId = (ushort)(i + 1);

                            // Write GRPICONDIRENTRY (14 bytes instead of 16 bytes)
                            grpWriter.Write(bWidth);
                            grpWriter.Write(bHeight);
                            grpWriter.Write(bColorCount);
                            grpWriter.Write(bReserved);
                            grpWriter.Write(wPlanes);
                            grpWriter.Write(wBitCount);
                            grpWriter.Write(dwBytesInRes);
                            grpWriter.Write(resId); // nId instead of dwImageOffset!

                            // Read actual image bytes and update RT_ICON
                            reader.BaseStream.Seek(dwImageOffset, SeekOrigin.Begin);
                            byte[] imgData = reader.ReadBytes((int)dwBytesInRes);

                            bool okIcon = UpdateResource(hUpdate, RT_ICON, (IntPtr)resId, 0, imgData, (uint)imgData.Length);
                            if (!okIcon)
                            {
                                Console.WriteLine("Warning: Failed to write RT_ICON #" + resId);
                            }
                        }

                        // Write RT_GROUP_ICON
                        byte[] grpData = grpStream.ToArray();
                        bool okGroup = UpdateResource(hUpdate, RT_GROUP_ICON, (IntPtr)1, 0, grpData, (uint)grpData.Length);
                        if (!okGroup)
                        {
                            Console.WriteLine("Warning: Failed to write RT_GROUP_ICON");
                        }
                    }
                }
            }

            // Step 5: Commit changes
            bool committed = EndUpdateResource(hUpdate, false);
            if (!committed)
            {
                Console.WriteLine("Error: EndUpdateResource failed. Error: " + Marshal.GetLastWin32Error());
                return 1;
            }

            Console.WriteLine("Successfully updated executable resources!");
            return 0;
        }
    }
}
