Dim appTitle, fso, shell, shortcutFilePath

appTitle = "Node DDNS Cloudflare"

Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

shortcutFilePath = shell.SpecialFolders("Startup") & "\" & appTitle & ".lnk"

If fso.FileExists(shortcutFilePath) Then
 fso.DeleteFile shortcutFilePath
 MsgBox "Disabled auto start.", vbInformation, appTitle
Else
 MsgBox "Found no auto start entry.", vbExclamation, appTitle
End If
