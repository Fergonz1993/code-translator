// ===== OWASP ZAP INTEGRATION =====
// Configuration and helpers for OWASP ZAP automated security scanning.

export interface ZAPScanConfig {
  targetUrl: string;
  apiKey?: string;
  contextName?: string;
  excludeUrls?: string[];
  scanPolicyName?: string;
  alertThreshold?: 'off' | 'low' | 'medium' | 'high';
}

export interface ZAPAlert {
  id: string;
  name: string;
  risk: 'Informational' | 'Low' | 'Medium' | 'High';
  confidence: 'False Positive' | 'Low' | 'Medium' | 'High' | 'Confirmed';
  url: string;
  description: string;
  solution: string;
  reference: string;
  cweid: string;
  wascid: string;
}

export interface ZAPScanResult {
  scanId: string;
  progress: number;
  state: 'running' | 'completed' | 'failed';
  alerts: ZAPAlert[];
  startTime: number;
  endTime?: number;
}

/**
 * Default ZAP configuration for Code Translator.
 */
export const DEFAULT_ZAP_CONFIG: Partial<ZAPScanConfig> = {
  contextName: 'code-translator',
  excludeUrls: [
    '.*\\.js$',
    '.*\\.css$',
    '.*\\.png$',
    '.*\\.jpg$',
    '.*\\.svg$',
    '.*\\/_next\\/.*',
    '.*\\/favicon\\.ico$',
  ],
  alertThreshold: 'medium',
};

/**
 * Generate ZAP automation framework YAML config.
 */
export function generateZAPAutomationConfig(config: ZAPScanConfig): string {
  return `
env:
  contexts:
    - name: "${config.contextName || 'default'}"
      urls:
        - "${config.targetUrl}"
      excludePaths:
${(config.excludeUrls || []).map(url => `        - "${url}"`).join('\n')}

jobs:
  - type: spider
    parameters:
      context: "${config.contextName || 'default'}"
      maxDuration: 5
      
  - type: spiderAjax
    parameters:
      context: "${config.contextName || 'default'}"
      maxDuration: 5
      
  - type: passiveScan-wait
    parameters:
      maxDuration: 10
      
  - type: activeScan
    parameters:
      context: "${config.contextName || 'default'}"
      ${config.scanPolicyName ? `policy: "${config.scanPolicyName}"` : ''}
      
  - type: report
    parameters:
      template: "traditional-json"
      reportDir: "./zap-reports"
      reportFile: "zap-report-{{date}}"
`.trim();
}

/**
 * Parse ZAP JSON report.
 */
export function parseZAPReport(reportJson: string): ZAPScanResult {
  try {
    const report = JSON.parse(reportJson);
    const alerts: ZAPAlert[] = [];
    
    for (const site of report.site || []) {
      for (const alert of site.alerts || []) {
        alerts.push({
          id: alert.pluginid,
          name: alert.alert || alert.name,
          risk: alert.riskdesc?.split(' ')[0] || 'Informational',
          confidence: alert.confidence || 'Low',
          url: alert.instances?.[0]?.uri || '',
          description: alert.desc || '',
          solution: alert.solution || '',
          reference: alert.reference || '',
          cweid: alert.cweid || '',
          wascid: alert.wascid || '',
        });
      }
    }
    
    return {
      scanId: report['@generated'] || Date.now().toString(),
      progress: 100,
      state: 'completed',
      alerts,
      startTime: Date.now(),
      endTime: Date.now(),
    };
  } catch {
    return {
      scanId: '',
      progress: 0,
      state: 'failed',
      alerts: [],
      startTime: Date.now(),
    };
  }
}

/**
 * Filter alerts by severity.
 */
export function filterAlertsBySeverity(
  alerts: ZAPAlert[],
  minSeverity: 'Informational' | 'Low' | 'Medium' | 'High'
): ZAPAlert[] {
  const severityOrder = ['Informational', 'Low', 'Medium', 'High'];
  const minIndex = severityOrder.indexOf(minSeverity);
  
  return alerts.filter(alert => 
    severityOrder.indexOf(alert.risk) >= minIndex
  );
}

/**
 * Generate security scan summary.
 */
export function generateScanSummary(result: ZAPScanResult): string {
  const byRisk = {
    High: result.alerts.filter(a => a.risk === 'High').length,
    Medium: result.alerts.filter(a => a.risk === 'Medium').length,
    Low: result.alerts.filter(a => a.risk === 'Low').length,
    Informational: result.alerts.filter(a => a.risk === 'Informational').length,
  };
  
  return `
# ZAP Security Scan Summary

- **Scan ID**: ${result.scanId}
- **State**: ${result.state}
- **Total Alerts**: ${result.alerts.length}

## Alerts by Severity

| Severity | Count |
|----------|-------|
| 🔴 High | ${byRisk.High} |
| 🟠 Medium | ${byRisk.Medium} |
| 🟡 Low | ${byRisk.Low} |
| ⚪ Info | ${byRisk.Informational} |

## High Severity Issues

${result.alerts
  .filter(a => a.risk === 'High')
  .map(a => `- **${a.name}**: ${a.url}\n  - ${a.solution}`)
  .join('\n') || 'None found'}
`.trim();
}
