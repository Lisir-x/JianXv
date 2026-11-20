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
