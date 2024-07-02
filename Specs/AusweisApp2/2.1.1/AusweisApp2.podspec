Pod::Spec.new do |s|
  s.name         = "AusweisApp2"
  s.version      = "2.1.1"
  s.summary      = "AusweisApp2 SDK"
  s.homepage     = "https://www.ausweisapp.bund.de/sdk/ios.html"
  s.license      = 'Apache License, Version 2.0'
  s.author       = { "Animo Solutions" => "contact@animo.id" }

  s.platform     = :ios, "13.0"

  s.source       = { :http => "https://github.com/Governikus/AusweisApp2-SDK-iOS/archive/refs/tags/2.1.1.zip" }
  s.framework    = "AusweisApp2"
  
  s.source_files = "**/*.h"
  s.vendored_frameworks = "AusweisApp2.xcframework"
end