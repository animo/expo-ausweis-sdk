require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'AusweisSdk'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = { :ios => '13.4', :tvos => '13.4' }
  s.swift_version  = '5.4'
  # s.source         = { git: 'https://github.com/animo/expo-ausweis-sdk' }
  # s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  # s.source_files = "**/*.{h,m,swift}"

  s.vendored_frameworks = 'AusweisApp2.xcframework'
  s.source       = { :git => "https://github.com/Governikus/AusweisApp2-SDK-iOS", :tag => "2.1.1" }


  # s.dependency 'AusweisApp2', '~> 2.1.1'
end
