Option Explicit

Dim shell, args
Set shell = CreateObject("WScript.Shell")

Function CommandExists(cmd)
 On Error Resume Next
 Dim exec, result
 Set exec = shell.Exec("cmd /c where " & cmd)
 result = exec.StdOut.ReadAll
 CommandExists = (Trim(result) <> "")
 On Error GoTo 0
End Function

Function EscapeArgument(arg)
 EscapeArgument = """" & Replace(arg, """", """""") & """"
End Function

If Not CommandExists("node") Then
 MsgBox "Error: Node.js is not found in PATH." & vbCrLf & _
  "Please make sure Node.js is installed and added to the PATH variable.", vbCritical
 WScript.Quit 1
End If

args = ""
If WScript.Arguments.Count > 0 Then
 Dim i
 For i = 0 To WScript.Arguments.Count - 1
  args = args & " " & EscapeArgument(WScript.Arguments(i))
 Next
End If

On Error Resume Next
shell.Run "cmd /c node ." & args, 0, False
If Err.Number <> 0 Then
 MsgBox "Error: Failed to launch Node.js." & vbCrLf & _
  "Details: " & Err.Description, vbCritical
 WScript.Quit 1
End If
On Error GoTo 0
