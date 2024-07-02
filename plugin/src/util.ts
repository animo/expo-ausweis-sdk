export function addAndroidImports(language: 'kt' | 'java', source: string, imports: string[]): string {
  const lines = source.split('\n')
  const lineIndexWithPackageDeclaration = lines.findIndex((line) =>
    language === 'kt' ? line.match(/^package .+$/) : line.match(/^package .+;$/)
  )

  for (const androidImport of imports) {
    if (!source.includes(androidImport)) {
      const importStatement = language === 'kt' ? `import ${androidImport}` : `import ${androidImport};`
      lines.splice(lineIndexWithPackageDeclaration + 1, 0, importStatement)
    }
  }
  return lines.join('\n')
}
