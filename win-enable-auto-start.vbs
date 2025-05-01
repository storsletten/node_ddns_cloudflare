Option Explicit

Dim appTitle, fso, shell, shortcut, shortcutFilePath

appTitle = "Node DDNS Cloudflare"

Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

shortcutFilePath = shell.SpecialFolders("Startup") & "\" & appTitle & ".lnk"

If fso.FileExists(shortcutFilePath) Then
 fso.DeleteFile shortcutFilePath
End If

Set shortcut = shell.CreateShortcut(shortcutFilePath)
shortcut.WorkingDirectory = shell.CurrentDirectory
shortcut.TargetPath = shell.CurrentDirectory & "\win-start-hidden.vbs"
shortcut.Arguments = ""
shortcut.Save

MsgBox "Enabled auto start.", vbInformation, appTitle
