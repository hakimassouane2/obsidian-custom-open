const { Plugin, Notice, Platform } = require("obsidian");
const { exec } = require("child_process");
const path = require("path");

class CustomOpenPlugin extends Plugin {
  async onload() {
    // Context menu on files and folders in the file explorer
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        menu.addItem((item) => {
          const submenu = item
            .setTitle("Open in...")
            .setIcon("arrow-up-right")
            .setSubmenu();

          submenu.addItem((sub) => {
            sub
              .setTitle("VS Code")
              .setIcon("code")
              .onClick(() => {
                this.openInVSCode(file);
              });
          });

          submenu.addItem((sub) => {
            sub
              .setTitle("Terminal")
              .setIcon("terminal")
              .onClick(() => {
                this.openInTerminal(file);
              });
          });
        });
      })
    );

    // Command palette: open vault in VS Code
    this.addCommand({
      id: "open-vault-in-vscode",
      name: "Open vault in VS Code",
      callback: () => {
        const vaultPath = this.app.vault.adapter.basePath;
        this.launchVSCode(vaultPath);
      },
    });

    // Command palette: open vault in terminal
    this.addCommand({
      id: "open-vault-in-terminal",
      name: "Open vault in terminal",
      callback: () => {
        const vaultPath = this.app.vault.adapter.basePath;
        this.launchTerminal(vaultPath);
      },
    });
  }

  getFullPath(file) {
    const vaultPath = this.app.vault.adapter.basePath;
    return `${vaultPath}/${file.path}`;
  }

  getFolderPath(file) {
    const fullPath = this.getFullPath(file);
    // If it's a folder (TFolder), use it directly; otherwise get the parent directory
    if (file.children !== undefined) {
      return fullPath;
    }
    return path.dirname(fullPath);
  }

  openInVSCode(file) {
    this.launchVSCode(this.getFullPath(file));
  }

  openInTerminal(file) {
    this.launchTerminal(this.getFolderPath(file));
  }

  launchVSCode(targetPath) {
    const command = `code "${targetPath}"`;
    exec(command, (error) => {
      if (error) {
        new Notice(
          "Could not open VS Code. Make sure 'code' is in your PATH."
        );
        console.error("Open in VS Code error:", error);
      }
    });
  }

  launchTerminal(folderPath) {
    let command;
    if (process.platform === "win32") {
      command = `start powershell -NoExit -Command "Set-Location -LiteralPath '${folderPath.replace(/'/g, "''")}'"`;    } else if (process.platform === "darwin") {
      command = `open -a Terminal "${folderPath}"`;
    } else {
      // Linux: try common terminal emulators
      command = `x-terminal-emulator --working-directory="${folderPath}" || xterm -e "cd '${folderPath}' && $SHELL"`;
    }

    exec(command, (error) => {
      if (error) {
        new Notice(
          "Could not open terminal. Check your system's default terminal configuration."
        );
        console.error("Open in Terminal error:", error);
      }
    });
  }
}

module.exports = CustomOpenPlugin;
