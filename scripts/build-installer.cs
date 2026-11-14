using System;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Diagnostics;
using System.Drawing;
using System.Windows.Forms;
using Microsoft.Win32;

namespace DoffNotesInstaller
{
    public class InstallerForm : Form
    {
        private ProgressBar progressBar;
        private Label statusLabel;
        private Label titleLabel;
        private Timer timer;
        private int step = 0;
        private string sourceDir;
        private string installDir;

        public InstallerForm()
        {
            this.Text = "Doff Notes Setup";
            this.Size = new Size(460, 240);
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.StartPosition = FormStartPosition.CenterScreen;
            this.BackColor = Color.FromArgb(246, 246, 248);

            try
            {
                this.Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
            }
            catch {}

            titleLabel = new Label();
            titleLabel.Text = "Installing Doff Notes";
            titleLabel.Font = new Font("Segoe UI", 16, FontStyle.Bold);
            titleLabel.ForeColor = Color.FromArgb(28, 28, 30);
            titleLabel.Location = new Point(32, 28);
            titleLabel.Size = new Size(380, 36);
            this.Controls.Add(titleLabel);

            statusLabel = new Label();
            statusLabel.Text = "Preparing installation...";
            statusLabel.Font = new Font("Segoe UI", 10);
            statusLabel.ForeColor = Color.FromArgb(110, 110, 115);
            statusLabel.Location = new Point(34, 72);
            statusLabel.Size = new Size(380, 24);
            this.Controls.Add(statusLabel);

            progressBar = new ProgressBar();
            progressBar.Location = new Point(34, 108);
            progressBar.Size = new Size(380, 22);
            progressBar.Style = ProgressBarStyle.Continuous;
            this.Controls.Add(progressBar);

            string exeDir = AppDomain.CurrentDomain.BaseDirectory;
            sourceDir = Path.Combine(exeDir, "Doff-Notes-win-x64");
            if (!Directory.Exists(sourceDir))
            {
                sourceDir = Path.Combine(exeDir, "..", "release", "Doff-Notes-win-x64");
            }
            if (!Directory.Exists(sourceDir))
            {
                sourceDir = Path.Combine(exeDir, "release", "Doff-Notes-win-x64");
            }

            string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            installDir = Path.Combine(localAppData, "Programs", "Doff Notes");

            timer = new Timer();
            timer.Interval = 120;
            timer.Tick += OnTick;
            timer.Start();
        }

        private void ExtractEmbeddedZip(Stream zipStream, string destination)
        {
            Directory.CreateDirectory(destination);
            using (ZipArchive archive = new ZipArchive(zipStream, ZipArchiveMode.Read))
            {
                foreach (ZipArchiveEntry entry in archive.Entries)
                {
                    string targetPath = Path.Combine(destination, entry.FullName);
                    if (string.IsNullOrEmpty(entry.Name))
                    {
                        Directory.CreateDirectory(targetPath);
                    }
                    else
                    {
                        string dir = Path.GetDirectoryName(targetPath);
                        if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
                        {
                            Directory.CreateDirectory(dir);
                        }
                        entry.ExtractToFile(targetPath, true);
                    }
                }
            }
        }

        private void CopyDirectory(string source, string destination)
        {
            Directory.CreateDirectory(destination);
            foreach (string file in Directory.GetFiles(source))
            {
                string destFile = Path.Combine(destination, Path.GetFileName(file));
                File.Copy(file, destFile, true);
            }
            foreach (string subDir in Directory.GetDirectories(source))
            {
                string destSubDir = Path.Combine(destination, Path.GetFileName(subDir));
                CopyDirectory(subDir, destSubDir);
            }
        }

        private void CreateShortcut(string shortcutPath, string targetPath, string iconPath, string description)
        {
            Type shellType = Type.GetTypeFromProgID("WScript.Shell");
            if (shellType == null) return;
            dynamic shell = Activator.CreateInstance(shellType);
            dynamic shortcut = shell.CreateShortcut(shortcutPath);
            shortcut.TargetPath = targetPath;
            shortcut.WorkingDirectory = Path.GetDirectoryName(targetPath);
            shortcut.Description = description;
            if (File.Exists(iconPath))
            {
                shortcut.IconLocation = iconPath;
            }
            shortcut.Save();
        }

        private void OnTick(object sender, EventArgs e)
        {
            step++;
            if (step == 1)
            {
                statusLabel.Text = "Closing any active instances...";
                progressBar.Value = 15;
                try
                {
                    foreach (var proc in Process.GetProcessesByName("Doff Notes"))
                    {
                        proc.Kill();
                        proc.WaitForExit(1000);
                    }
                }
                catch {}
            }
            else if (step == 2)
            {
                statusLabel.Text = "Installing Doff Notes to your system...";
                progressBar.Value = 40;
                try
                {
                    Assembly asm = Assembly.GetExecutingAssembly();
                    Stream embeddedZip = asm.GetManifestResourceStream("app.zip");

                    if (embeddedZip != null)
                    {
                        using (embeddedZip)
                        {
                            ExtractEmbeddedZip(embeddedZip, installDir);
                        }
                    }
                    else if (Directory.Exists(sourceDir))
                    {
                        CopyDirectory(sourceDir, installDir);
                    }
                    else
                    {
                        MessageBox.Show("Installation package missing. Please re-download Doff-Notes-Setup.exe.", "Setup Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                        this.Close();
                        return;
                    }
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Error extracting files: " + ex.Message, "Setup Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    this.Close();
                    return;
                }
            }
            else if (step == 3)
            {
                statusLabel.Text = "Creating Desktop and Start Menu shortcuts...";
                progressBar.Value = 75;

                string targetExe = Path.Combine(installDir, "Doff Notes.exe");
                string iconPath = Path.Combine(installDir, "resources", "app", "resources", "icon.ico");
                if (!File.Exists(iconPath))
                {
                    iconPath = Path.Combine(installDir, "resources", "icon.ico");
                }
                if (!File.Exists(iconPath))
                {
                    iconPath = targetExe;
                }

                // Desktop shortcut
                string desktopDir = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                string desktopLnk = Path.Combine(desktopDir, "Doff Notes.lnk");
                CreateShortcut(desktopLnk, targetExe, iconPath, "Doff Notes - Apple Notes for Windows");

                // Start Menu shortcut
                string appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
                string startMenuDir = Path.Combine(appData, "Microsoft", "Windows", "Start Menu", "Programs", "Doff Notes");
                Directory.CreateDirectory(startMenuDir);
                string startMenuLnk = Path.Combine(startMenuDir, "Doff Notes.lnk");
                CreateShortcut(startMenuLnk, targetExe, iconPath, "Doff Notes - Apple Notes for Windows");

                // Registry entry in Windows Settings > Apps / Add or Remove Programs
                try
                {
                    using (RegistryKey key = Registry.CurrentUser.CreateSubKey(@"Software\Microsoft\Windows\CurrentVersion\Uninstall\DoffNotes"))
                    {
                        if (key != null)
                        {
                            key.SetValue("DisplayName", "Doff Notes");
                            key.SetValue("DisplayVersion", "1.0.0");
                            key.SetValue("Publisher", "Doff Notes");
                            key.SetValue("DisplayIcon", targetExe + ",0");
                            key.SetValue("InstallLocation", installDir);
                            key.SetValue("UninstallString", "\"" + Path.Combine(installDir, "Uninstall.cmd") + "\"");
                        }
                    }
                }
                catch {}

                // Create clean Uninstaller
                string uninstallerCmd = Path.Combine(installDir, "Uninstall.cmd");
                string cmdContent = "@echo off\r\n" +
                    "taskkill /F /IM \"Doff Notes.exe\" >nul 2>&1\r\n" +
                    "del /Q \"%USERPROFILE%\\Desktop\\Doff Notes.lnk\" >nul 2>&1\r\n" +
                    "rmdir /S /Q \"%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Doff Notes\" >nul 2>&1\r\n" +
                    "reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\DoffNotes\" /f >nul 2>&1\r\n" +
                    "timeout /t 1 >nul\r\n" +
                    "rmdir /S /Q \"" + installDir + "\" >nul 2>&1\r\n" +
                    "exit\r\n";
                File.WriteAllText(uninstallerCmd, cmdContent);
            }
            else if (step == 4)
            {
                statusLabel.Text = "Installation complete! Launching Doff Notes...";
                progressBar.Value = 100;
            }
            else if (step == 5)
            {
                timer.Stop();
                string targetExe = Path.Combine(installDir, "Doff Notes.exe");
                if (File.Exists(targetExe))
                {
                    try { Process.Start(targetExe); } catch {}
                }
                this.Close();
            }
        }

        [STAThread]
        public static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new InstallerForm());
        }
    }
}
