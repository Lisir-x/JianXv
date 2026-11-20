; electron-builder falls back to the package name when the product name is non-ASCII.
!undef APP_FILENAME
!define APP_FILENAME "${PRODUCT_FILENAME}"

!ifndef BUILD_UNINSTALLER
  Var JianxuPerUserFolder
  Var JianxuPerMachineFolder

  !macro customPageAfterChangeDir
    ; Keep the registered directory for an in-place update. The new default
    ; suffix still applies to a fresh install or an explicitly chosen parent.
    !undef MUI_PAGE_CUSTOMFUNCTION_PRE
    !define MUI_PAGE_CUSTOMFUNCTION_PRE jianxuPrepareInstallDirectory
    Function jianxuPrepareInstallDirectory
      ${If} $INSTDIR != $JianxuPerUserFolder
      ${AndIf} $INSTDIR != $JianxuPerMachineFolder
        Call instFilesPre
      ${EndIf}
    FunctionEnd
  !macroend

  !macro customFiles_x64
    ; The old uninstaller has closed the app and preserved its data. Rename the
    ; whole upgraded folder before the new registry entries and shortcuts are written.
    ${If} $INSTDIR == $JianxuPerUserFolder
    ${OrIf} $INSTDIR == $JianxuPerMachineFolder
      ${GetFileName} "$INSTDIR" $R8
      ${If} $R8 == "personal-todo"
      ${OrIf} $R8 == "PersonalTodo"
        ${GetParent} "$INSTDIR" $R9
        StrCpy $R9 "$R9\${APP_FILENAME}"
        SetOutPath "$TEMP"
        ClearErrors
        Rename "$INSTDIR" "$R9"
        ${If} ${Errors}
          MessageBox MB_OK|MB_ICONEXCLAMATION "已在原目录完成更新，但无法将安装文件夹改名为「笺序」。程序及原有数据仍在 $INSTDIR。请确认同级目录没有同名文件夹，关闭占用目录的程序后重试。" /SD IDOK
          ClearErrors
        ${Else}
          StrCpy $INSTDIR $R9
          StrCpy $appExe "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
          StrCpy $keepShortcuts "false"
        ${EndIf}
        SetOutPath "$INSTDIR"
      ${EndIf}
    ${EndIf}
  !macroend
!endif

!macro ProtectLegacyData ROOT_KEY
  ReadRegStr $R8 ${ROOT_KEY} "${INSTALL_REGISTRY_KEY}" "InstallLocation"
  ${If} $R8 != ""
    ${If} ${FileExists} "$R8\我的待办数据\*.*"
    ${OrIf} ${FileExists} "$R8\todo-location.json"
      MessageBox MB_OK|MB_ICONEXCLAMATION "检测到旧版将数据或位置配置保存在程序目录。安装已停止，旧数据未修改。请先在旧版中导出备份并彻底退出，再将旧数据和位置配置移出安装目录后重试。安装后可导入备份。" /SD IDOK
      SetErrorLevel 2
      Quit
    ${EndIf}
  ${EndIf}
!macroend

!macro customInit
  !insertmacro ProtectLegacyData HKCU
  !insertmacro ProtectLegacyData HKLM
  ReadRegStr $JianxuPerUserFolder HKCU "${INSTALL_REGISTRY_KEY}" "InstallLocation"
  ReadRegStr $JianxuPerMachineFolder HKLM "${INSTALL_REGISTRY_KEY}" "InstallLocation"
!macroend


!macro RefreshJianxuShortcut link
  ${If} ${FileExists} "${link}"
    CreateShortCut "${link}" "$appExe" "" "$INSTDIR\resources\jianxu-taskbar.ico" 0 "" "" "${APP_DESCRIPTION}"
    WinShell::SetLnkAUMI "${link}" "${APP_ID}"
    System::Call 'shell32::SHChangeNotify(i 0x2000, i 0x1005, w "${link}", p 0)'
  ${EndIf}
!macroend

!macro customInstall
  !insertmacro RefreshJianxuShortcut "$newStartMenuLink"
  ${IfNot} ${isNoDesktopShortcut}
    !insertmacro RefreshJianxuShortcut "$newDesktopLink"
  ${EndIf}
!macroend

!macro customUnInstall
  ${IfNot} ${isUpdated}
    ClearErrors
    ExecWait '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" --remove-app-data' $R8
    ${If} ${Errors}
    ${OrIf} $R8 != 0
      MessageBox MB_OK|MB_ICONEXCLAMATION "无法清理待办数据。请彻底退出应用并确认自选数据盘可访问后重试。" /SD IDOK
      SetErrorLevel 2
      Quit
    ${EndIf}
  ${EndIf}
!macroend

!macro customRemoveFiles
  ; Data cleanup runs only for explicit uninstall, never for an update.
  SetOutPath $TEMP
  Delete "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
  Delete "$INSTDIR\${UNINSTALL_FILENAME}"
  Delete "$INSTDIR\chrome_100_percent.pak"
  Delete "$INSTDIR\chrome_200_percent.pak"
  Delete "$INSTDIR\d3dcompiler_47.dll"
  Delete "$INSTDIR\dxcompiler.dll"
  Delete "$INSTDIR\electron_wer.dll"
  Delete "$INSTDIR\ffmpeg.dll"
  Delete "$INSTDIR\icudtl.dat"
  Delete "$INSTDIR\LICENSE.electron.txt"
  Delete "$INSTDIR\LICENSES.chromium.html"
  Delete "$INSTDIR\resources.pak"
  Delete "$INSTDIR\snapshot_blob.bin"
  Delete "$INSTDIR\v8_context_snapshot.bin"
  Delete "$INSTDIR\vk_swiftshader.dll"
  Delete "$INSTDIR\vk_swiftshader_icd.json"
  Delete "$INSTDIR\vulkan-1.dll"
  RMDir /r "$INSTDIR\locales"
  RMDir /r "$INSTDIR\resources"
  RMDir "$INSTDIR"
!macroend
