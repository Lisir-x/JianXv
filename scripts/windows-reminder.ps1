$ErrorActionPreference = 'Stop'
$request = $env:JIANXU_TOAST | ConvertFrom-Json

$null = [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime]
$null = [Windows.UI.Notifications.ToastNotification, Windows.UI.Notifications, ContentType = WindowsRuntime]
$xml = [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime]::new()
$xml.LoadXml('<toast activationType="protocol"><visual><binding template="ToastGeneric"><text/><text/><image placement="appLogoOverride"/></binding></visual></toast>')
$xml.DocumentElement.SetAttribute('launch', $request.uri)
$xml.GetElementsByTagName('text').Item(0).InnerText = $request.title
$xml.GetElementsByTagName('text').Item(1).InnerText = $request.body
$logo = [Uri]::new($request.logo).AbsoluteUri
$xml.GetElementsByTagName('image').Item(0).SetAttribute('src', $logo)

$toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($request.appId).Show($toast)
