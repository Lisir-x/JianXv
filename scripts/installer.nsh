; electron-builder falls back to the package name when the product name is non-ASCII.
!undef APP_FILENAME
!define APP_FILENAME "${PRODUCT_FILENAME}"

!ifndef BUILD_UNINSTALLER
  !include nsDialogs.nsh
  !include "${PROJECT_DIR}\scripts\jianxu-directory.nsh"

  Var JianxuPerUserFolder
  Var JianxuPerMachineFolder
  Var JianxuDirectory
  Var JianxuDesktopCheckbox
  Var JianxuDesktopChoice

  !macro customPageAfterChangeDir
    Page custom jianxuInstallOptions jianxuSaveInstallOptions

    Function jianxuInstallOptions
      ${If} ${isUpdated}
        Abort
      ${EndIf}

      ; A stale registration must not lock the location field for a fresh install.
      ${If} $INSTDIR == $JianxuPerUserFolder
      ${OrIf} $INSTDIR == $JianxuPerMachineFolder
        ${IfNot} ${FileExists} "$INSTDIR\*.*"
          ${GetParent} "$INSTDIR" $0
          Push $0
          Call jianxuNormalizeDirectory
          Pop $INSTDIR
        ${EndIf}
      ${EndIf}

      !insertmacro MUI_HEADER_TEXT "安装选项" "选择笺序的安装位置和快捷方式。"
      nsDialogs::Create 1018
      Pop $0
      ${If} $0 == error
        Abort
      ${EndIf}

      ${NSD_CreateLabel} 0 0 100% 12u "安装目录"
      Pop $0
      ${NSD_CreateDirRequest} 0 16u 76% 14u "$INSTDIR"
      Pop $JianxuDirectory
      ${NSD_CreateBrowseButton} 79% 16u 21% 14u "浏览..."
      Pop $0
      ${NSD_OnClick} $0 jianxuBrowseDirectory
      ${If} $INSTDIR == $JianxuPerUserFolder
      ${OrIf} $INSTDIR == $JianxuPerMachineFolder
        EnableWindow $JianxuDirectory 0
        EnableWindow $0 0
        ${NSD_CreateLabel} 0 38u 100% 14u "检测到已安装的版本，将在原位置更新并保留数据。"
      ${Else}
        ${NSD_CreateLabel} 0 38u 100% 14u "选择上一级文件夹后，安装程序会自动补上「笺序」。"
      ${EndIf}
      Pop $0

      ${NSD_CreateCheckbox} 0 63u 100% 14u "创建桌面快捷方式"
      Pop $JianxuDesktopCheckbox
      ${NSD_SetState} $JianxuDesktopCheckbox $JianxuDesktopChoice
      ${NSD_CreateLabel} 0 86u 100% 24u "安装后，会在 Windows 开始菜单的「所有应用」中添加「笺序」，用于启动和系统通知。"
      Pop $0
      nsDialogs::Show
    FunctionEnd

    Function jianxuBrowseDirectory
      Pop $0 ; Button handle
      ${NSD_GetText} $JianxuDirectory $0
      ${IfNot} ${FileExists} "$0\*.*"
        ${GetParent} "$0" $0
      ${EndIf}
      nsDialogs::SelectFolderDialog "选择安装位置" "$0"
      Pop $0
      ${If} $0 != error
        Push $0
        Call jianxuNormalizeDirectory
        Pop $0
        ${If} $0 != ""
          ${NSD_SetText} $JianxuDirectory "$0"
        ${EndIf}
      ${EndIf}
    FunctionEnd

    Function jianxuSaveInstallOptions
      ${NSD_GetState} $JianxuDesktopCheckbox $JianxuDesktopChoice
      ${If} $INSTDIR == $JianxuPerUserFolder
      ${OrIf} $INSTDIR == $JianxuPerMachineFolder
        Return
      ${EndIf}
      ${NSD_GetText} $JianxuDirectory $0
      Push $0
      Call jianxuNormalizeDirectory
      Pop $0
      ${If} $0 == ""
        MessageBox MB_OK|MB_ICONEXCLAMATION "请选择有效的安装目录。"
        Abort
      ${EndIf}
      StrCpy $INSTDIR $0
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
  ReadRegStr $JianxuDesktopChoice SHELL_CONTEXT "${INSTALL_REGISTRY_KEY}" "DesktopShortcut"
  ${If} $JianxuDesktopChoice == ""
    StrCpy $JianxuDesktopChoice ${BST_CHECKED}
  ${EndIf}
  !insertmacro ProtectLegacyData HKCU
  !insertmacro ProtectLegacyData HKLM
  ReadRegStr $JianxuPerUserFolder HKCU "${INSTALL_REGISTRY_KEY}" "InstallLocation"
  ReadRegStr $JianxuPerMachineFolder HKLM "${INSTALL_REGISTRY_KEY}" "InstallLocation"
!macroend


!macro WriteJianxuShortcut link
  CreateShortCut "${link}" "$appExe" "" "$INSTDIR\resources\jianxu-taskbar.ico" 0 "" "" "${APP_DESCRIPTION}"
  WinShell::SetLnkAUMI "${link}" "${APP_ID}"
  System::Call 'shell32::SHChangeNotify(i 0x2000, i 0x1005, w "${link}", p 0)'
!macroend

!macro customInstall
  ; The Start menu link and the app process share this notification identity.
  WriteRegStr SHELL_CONTEXT "Software\Classes\AppUserModelId\${APP_ID}" "DisplayName" "${PRODUCT_NAME}"
  WriteRegStr SHELL_CONTEXT "Software\Classes\AppUserModelId\${APP_ID}" "IconUri" "$INSTDIR\resources\jianxu-notification.png"
  !insertmacro createMenuDirectory
  !insertmacro WriteJianxuShortcut "$newStartMenuLink"
  StrCpy $launchLink "$newStartMenuLink"
  ${If} $oldDesktopLink != $newDesktopLink
  ${AndIf} ${FileExists} "$oldDesktopLink"
    WinShell::UninstShortcut "$oldDesktopLink"
    Delete "$oldDesktopLink"
  ${EndIf}
  ${If} $JianxuDesktopChoice == ${BST_CHECKED}
  ${AndIfNot} ${isNoDesktopShortcut}
    !insertmacro WriteJianxuShortcut "$newDesktopLink"
    WriteRegStr SHELL_CONTEXT "${INSTALL_REGISTRY_KEY}" "DesktopShortcut" "${BST_CHECKED}"
  ${Else}
    ${If} ${FileExists} "$newDesktopLink"
      WinShell::UninstShortcut "$newDesktopLink"
      Delete "$newDesktopLink"
    ${EndIf}
    WriteRegStr SHELL_CONTEXT "${INSTALL_REGISTRY_KEY}" "DesktopShortcut" "${BST_UNCHECKED}"
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
    DeleteRegKey SHELL_CONTEXT "Software\Classes\AppUserModelId\${APP_ID}"
    WinShell::UninstShortcut "$oldDesktopLink"
    Delete "$oldDesktopLink"
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
