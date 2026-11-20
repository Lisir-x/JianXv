!include FileFunc.nsh
!include LogicLib.nsh

; Consume an absolute folder path and return a canonical path that ends in
; APP_FILENAME, or an empty string if the input is invalid.
Function jianxuNormalizeDirectory
  Exch $0
  Push $1
  Push $2
  ${GetRoot} "$0" $1
  ${If} $1 == ""
    StrCpy $0 ""
  ${ElseIf} $0 == $1
    ; The picker returns a drive root, but a manually entered drive may omit the slash.
    StrCpy $0 "$0\"
  ${Else}
    StrLen $2 $1
    StrCpy $2 $0 1 $2
    ${If} $2 != "\"
      StrCpy $0 ""
    ${EndIf}
  ${EndIf}
  ${If} $0 != ""
    ; NSIS GetFullPathName requires an existing directory. A path typed into
    ; the installer is allowed to name a new folder.
    System::Call 'kernel32::GetFullPathNameW(w r0, i ${NSIS_MAX_STRLEN}, w .r1, p 0) i .r2'
    ${If} $2 == 0
    ${OrIf} $2 >= ${NSIS_MAX_STRLEN}
      StrCpy $0 ""
    ${Else}
      StrCpy $0 $1
      ${GetFileName} "$0" $1
      ${If} $1 != "${APP_FILENAME}"
        StrCpy $2 $0 1 -1
        ${If} $2 != "\"
          StrCpy $0 "$0\"
        ${EndIf}
        StrCpy $0 "$0${APP_FILENAME}"
      ${Else}
        StrCpy $2 $0 1 -1
        ${If} $2 == "\"
          StrCpy $0 $0 -1
        ${EndIf}
      ${EndIf}
    ${EndIf}
  ${EndIf}
  Pop $2
  Pop $1
  Exch $0
FunctionEnd
