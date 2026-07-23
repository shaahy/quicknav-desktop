import { Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// ── Types ──

export interface AxeViolation {
  id: string
  impact: 'minor' | 'moderate' | 'serious' | 'critical'
  description: string
  help: string
  helpUrl: string
  nodes: Array<{
    html: string
    target: string[]
    failureSummary: string
  }>
}

export interface AxeReport {
  violations: AxeViolation[]
  violationCount: number
  passes: number
  incomplete: number
  inapplicable: number
  timestamp: string
}

// ── Helper ──

/**
 * Format violations into a human-readable summary string.
 */
export function formatViolations(report: AxeReport): string {
  if (report.violationCount === 0) return 'No WCAG 2.2 AA violations found.'

  const lines = report.violations.map((v, i) => {
    const nodeCount = v.nodes.length
    return [
      `\n${i + 1}. ${v.id} (${v.impact})`,
      `   Help: ${v.help}`,
      `   URL:  ${v.helpUrl}`,
      `   Nodes: ${nodeCount}`,
      ...v.nodes.map((n, j) =>
        `     [${j + 1}] ${n.html}\n           Target: ${n.target.join(', ')}`
      ),
    ].join('\n')
  })

  return [
    `Found ${report.violationCount} WCAG 2.2 AA violation(s):`,
    ...lines,
    `\nPasses: ${report.passes} | Incomplete: ${report.incomplete} | Inapplicable: ${report.inapplicable}`,
  ].join('\n')
}

/**
 * Run axe-core WCAG 2.2 AA audit against the current Playwright page.
 *
 * Usage:
 *   const report = await runA11yCheck(page)
 *   expect(report.violationCount).toBe(0)
 *
 * @param page - Playwright Page instance
 * @param options - Optional overrides (e.g. custom rules, element exclude)
 */
export async function runA11yCheck(
  page: Page,
  options?: {
    disableRules?: string[]
    exclude?: string[]
  }
): Promise<AxeReport> {
  const builder = new AxeBuilder({ page }).withTags(['wcag22aa'])

  if (options?.disableRules) {
    builder.disableRules(options.disableRules)
  }

  if (options?.exclude) {
    for (const sel of options.exclude) {
      builder.exclude(sel)
    }
  }

  const results = await builder.analyze()

  return {
    violations: results.violations as unknown as AxeViolation[],
    violationCount: results.violations.length,
    passes: results.passes.length,
    incomplete: results.incomplete.length,
    inapplicable: results.inapplicable.length,
    timestamp: new Date().toISOString(),
  }
}
