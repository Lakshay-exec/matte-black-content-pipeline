Add-Type -AssemblyName System.Speech
$voice = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voice.Rate = 1
$outputPath = "C:\Users\kando\.gemini\antigravity\scratch\matte-black-content-pipeline\sample_voice.wav"
$voice.SetOutputToWaveFile($outputPath)
$voice.Speak("The future of content is not more noise. It is pure, unfiltered signal. Autonomous pipelines are winning. Subscribe for daily intelligence.")
$voice.Dispose()
Write-Host "Audio synthesized successfully to $outputPath"
