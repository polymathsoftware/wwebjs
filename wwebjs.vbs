'// Source - https://stackoverflow.com/a/66684508
'// Posted by Hifihedgehog, modified by community. See post 'Timeline' for change history
'// Retrieved 2026-05-27, License - CC BY-SA 4.0

'to find processes and kill
'wmic process where "name='node.exe'" get ProcessId,CommandLine

Dim objShell
Set objShell = WScript.CreateObject("WScript.Shell")
objShell.CurrentDirectory = "d:\wwebjs\"
objShell.Run("""node"" server.js"), 0
Set objShell = Nothing
