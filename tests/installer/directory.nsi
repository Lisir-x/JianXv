; Compile with makensis /DTEST_OUT=<absolute exe path> directory.nsi,
; then run the output. A nonzero exit code indicates a failed case.
Unicode true
Name "Jianxu installer directory tests"
OutFile "${TEST_OUT}"
SilentInstall silent
RequestExecutionLevel user

!define APP_FILENAME "笺序"
!include "..\..\scripts\jianxu-directory.nsh"

!macro AssertDirectory input expected failureCode
  Push "${input}"
  Call jianxuNormalizeDirectory
  Pop $0
  ${If} $0 != "${expected}"
    SetErrorLevel ${failureCode}
    Quit
  ${EndIf}
!macroend

Section
  !insertmacro AssertDirectory "E:\" "E:\笺序" 1
  !insertmacro AssertDirectory "E:" "E:\笺序" 2
  !insertmacro AssertDirectory "E:\应用\笺序资料" "E:\应用\笺序资料\笺序" 3
  !insertmacro AssertDirectory "E:\应用\笺序\" "E:\应用\笺序" 4
  !insertmacro AssertDirectory "E:\应用\笺序" "E:\应用\笺序" 5
  !insertmacro AssertDirectory "E:相对路径" "" 6
  !insertmacro AssertDirectory "相对路径" "" 7
  !insertmacro AssertDirectory "\\server\share" "\\server\share\笺序" 8
  SetErrorLevel 0
SectionEnd
