param(
  [Parameter(Mandatory = $true)]
  [string]$BaseUrl,
  [switch]$SkipCertificateCheck
)

$invoke = @{
  Uri = "$BaseUrl/health/live"
  Method = "Get"
  TimeoutSec = 10
}
if ($SkipCertificateCheck -and $PSVersionTable.PSVersion.Major -ge 7) {
  $invoke.SkipCertificateCheck = $true
}

$live = Invoke-WebRequest @invoke
if ($live.StatusCode -ne 200) { throw "Liveness failed" }
$invoke.Uri = "$BaseUrl/health/ready"
$ready = Invoke-WebRequest @invoke
if ($ready.StatusCode -ne 200) { throw "Readiness failed" }

$instances = 1..20 | ForEach-Object {
  (Invoke-WebRequest @invoke).Headers["x-instance-id"]
}
if ($instances -notcontains "api-a" -or $instances -notcontains "api-b") {
  throw "Load balancer did not expose both API slots: $($instances -join ', ')"
}
Write-Output "Smoke checks passed through api-a and api-b."
