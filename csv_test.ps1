try {
  $wc = New-Object System.Net.WebClient
  $wc.Headers.Add('User-Agent','Mozilla/5.0')
  $text = $wc.DownloadString('https://docs.google.com/spreadsheets/d/e/2PACX-1vSJQD5afdvI_-8W-2m3lqfuXU76v8TYDm7YfZfIzI0s5VYLwbkx2yXmmMB6MvkLk0us1rREgoq5rCTH/pub?output=csv')
  Write-Output "LENGTH:$($text.Length)"
  Write-Output "HEAD:$($text.Substring(0,[Math]::Min(200,$text.Length)))"
} catch {
  Write-Output 'ERROR'
  Write-Output $_.Exception.Message
}
