/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { GoogleGenAI, Type } from '@google/genai';
import Markdown from 'react-markdown';
import { 
  Terminal, ChevronRight, Loader2, Play, 
  FileCode, Beaker, Scale, Rocket, Search, Database, Clock, MapPin, CheckCircle, FileText, Calculator, TrendingUp, BookOpen, ShieldCheck, Bell, Send, Mail, Linkedin, Zap, Activity, GitBranch, Users
} from 'lucide-react';

const TARGETS = {
  'conduct-consultation': {
    id: 'conduct-consultation',
    icon: <Users className="w-4 h-4" />,
    executor: 'nx:run-commands',
    options: {
      command: 'python scripts/consultation_bot.py --area=Love_Lane_Estate --principles=Haringey_Deal',
      runtime: '7d'
    },
    description: 'Aggregates resident feedback to create a Co-Design Report for the Meanwhile Use application.',
    simulatedLogs: [
      '> nx run Sovereign Nexus:conduct-consultation',
      '> python scripts/consultation_bot.py --area=Love_Lane_Estate --principles=Haringey_Deal',
      'Initializing consultation bot...',
      'Target area: Love_Lane_Estate',
      'Applying principles: Haringey_Deal',
      'Aggregating resident feedback (simulated 7d runtime)...',
      'Generating Co-Design Report...',
      '✔ Consultation complete. Report generated.'
    ]
  },
  lint: {
    id: 'lint',
    icon: <FileCode className="w-4 h-4" />,
    executor: '@nx/linter:eslint',
    description: 'Checks prompt syntax and YAML/JSON configuration for errors.',
    simulatedLogs: [
      '> nx run Sovereign Nexus:lint',
      '> eslint apps/Sovereign Nexus/**/*.ts prompts/**/*.yaml',
      '✔  apps/Sovereign Nexus/src/logic.ts - 0 errors, 0 warnings',
      '✔  apps/Sovereign Nexus/prompts/system.yaml - Valid YAML syntax',
      '✔  apps/Sovereign Nexus/prompts/case_schema.json - Valid JSON schema',
      '',
      'Successfully ran target lint for project Sovereign Nexus'
    ]
  },
  test: {
    id: 'test',
    icon: <Beaker className="w-4 h-4" />,
    executor: '@nx/jest:jest',
    description: "Unit tests for the agent's tool-calling logic and math functions.",
    simulatedLogs: [
      '> nx run Sovereign Nexus:test',
      '> jest apps/Sovereign Nexus/src/logic.spec.ts',
      'PASS apps/Sovereign Nexus/src/logic.spec.ts',
      '  Agent Logic',
      '    ✓ should correctly parse tool calls (24 ms)',
      '    ✓ should calculate operating budget margins (12 ms)',
      '    ✓ should fallback gracefully on API timeout (15 ms)',
      '',
      'Test Suites: 1 passed, 1 total',
      'Tests:       3 passed, 3 total',
      'Snapshots:   0 total',
      'Time:        1.24 s',
      '',
      'Successfully ran target test for project Sovereign Nexus'
    ]
  },
  'test-integration': {
    id: 'test-integration',
    icon: <Beaker className="w-4 h-4" />,
    executor: '@nx/jest:jest',
    description: 'Runs integration tests for agent handoff.',
    dependsOn: ['^build'],
    options: {
      testFile: 'apps/Sovereign Nexus/tests/agent_handoff.spec.ts',
      passWithNoTests: true
    },
    configurations: {
      ci: {
        ci: true,
        codeCoverage: true
      }
    },
    simulatedLogs: [
      '> nx affected --target=test-integration',
      '',
      '✔  nx run Sovereign Nexus:test-integration (2s)',
      '',
      '———————————————————————————————————————————————————————————————————————————————',
      '',
      '>  NX   Successfully ran target test-integration for 1 project',
      '',
      '   View logs and run details at https://nx.app/runs/xyz123'
    ]
  },
  deploy: {
    id: 'deploy',
    icon: <Rocket className="w-4 h-4" />,
    executor: 'nx:run-commands',
    description: 'Deploys the agent to the specified environment.',
    options: {
      command: 'python scripts/deploy.py',
      args: ['env']
    },
    simulatedLogs: [
      '> nx run Sovereign Nexus:deploy --env=production',
      '> python scripts/deploy.py --env=production',
      'Authenticating with cloud provider...',
      'Building agent container image...',
      'Pushing image to registry...',
      'Deploying to production cluster...',
      '✔ Deployment successful.',
      'Endpoint: https://api.production.Sovereign Nexus.internal',
      '',
      'Successfully ran target deploy for project Sovereign Nexus'
    ]
  },
  eval: {
    id: 'eval',
    icon: <Scale className="w-4 h-4" />,
    executor: 'nx:run-commands',
    description: "LLM-as-a-judge: Uses a stronger model to grade the agent's 'Case for Support' outputs.",
    options: {
      command: "python scripts/eval_agent.py --suite=capital-campaign",
      parallel: false
    },
    configurations: {
      strict: {
        command: "python scripts/eval_agent.py --suite=capital-campaign --threshold=0.95"
      }
    },
    outputs: ["{workspaceRoot}/dist/eval-results/Sovereign Nexus"]
  },
  'match-uk-grants': {
    id: 'match-uk-grants',
    icon: <Search className="w-4 h-4" />,
    executor: 'nx:run-commands',
    options: {
      command: 'python scripts/uk_grant_matcher.py --postcode=SW9 --radius=2km',
      dependsOn: ['fetch-imd-data']
    },
    description: 'Searches 360Giving for funders who have a history of supporting SW9-based community projects.',
    simulatedLogs: [
      '> nx run Sovereign Nexus:match-uk-grants',
      '✔ nx run Sovereign Nexus:fetch-imd-data (cached)',
      '> python scripts/uk_grant_matcher.py --postcode=SW9 --radius=2km',
      'Querying 360Giving API...',
      'Filtering by location (SW9, 2km radius)...',
      'Found 12 matching funders.',
      '✔ Successfully ran target match-uk-grants for project Sovereign Nexus'
    ]
  },
  'report-impact': {
    id: 'report-impact',
    icon: <FileText className="w-4 h-4" />,
    executor: 'nx:run-commands',
    dependsOn: ['execute-outreach', 'validate-need'],
    description: 'Aggregates social value data to generate the mandatory UK CIC34 report.',
    options: {
      command: 'python scripts/generate_cic34.py --period=2026',
      outputPath: '{projectRoot}/outputs/compliance'
    },
    simulatedLogs: [
      '> nx run Sovereign Nexus:report-impact',
      '✔ nx run Sovereign Nexus:validate-need (cached)',
      '✔ nx run Sovereign Nexus:execute-outreach (cached)',
      '> python scripts/generate_cic34.py --period=2026',
      'Aggregating social value data...',
      'Generating CIC34 report...',
      '✔ Report saved to outputs/compliance/cic34_report_2026.pdf',
      '',
      'Successfully ran target report-impact for project Sovereign Nexus'
    ]
  },
  'search-grants': {
    id: 'search-grants',
    icon: <Search className="w-4 h-4" />,
    executor: 'nx:run-commands',
    description: 'Searches for community center grants and extracts eligibility, deadlines, and funding amounts.'
  },
  'match-stakeholders': {
    id: 'match-stakeholders',
    icon: <Users className="w-4 h-4" />,
    executor: 'nx:run-commands',
    description: 'Scans Council minutes and LinkedIn activity to identify high-affinity entry points for the CEO.',
    options: {
      command: 'python scripts/stakeholder_intelligence.py --region=N17 --focus=STEM-Health',
      cache: true
    }
  },
  'simulate-pricing': {
    id: 'simulate-pricing',
    icon: <Calculator className="w-4 h-4" />,
    executor: 'nx:run-commands',
    options: {
      command: 'python scripts/price_simulator.py --market=N17 --competitor=RoboThink',
      params: {
        min_social_value: 3.0,
        target_self_sufficiency: 0.40
      }
    },
    description: 'Adjusts tiered pricing based on current Haringey grant availability and competitor rates.',
    simulatedLogs: [
      '> nx run Sovereign Nexus:simulate-pricing',
      '> python scripts/price_simulator.py --market=N17 --competitor=RoboThink',
      'Loading market data for N17...',
      'Analyzing competitor: RoboThink...',
      'Calculating optimal tiered pricing...',
      '✔ Pricing simulation complete. Target self-sufficiency (40%) achievable.'
    ]
  },
  'sync-grants': {
    id: 'sync-grants',
    icon: <Database className="w-4 h-4" />,
    executor: 'nx:run-commands',
    description: 'Weekly task to scrape and cache new grant opportunities.',
    options: {
      command: 'python scripts/sync_grant_db.py',
      cron: '0 0 * * 1'
    },
    simulatedLogs: [
      '> nx run Sovereign Nexus:sync-grants',
      '> python scripts/sync_grant_db.py',
      'Connecting to grant databases...',
      'Scraping new opportunities (Firecrawl API)...',
      'Found 12 new grants matching criteria.',
      'Updating local cache...',
      '✔ Cache updated successfully.',
      '',
      'Successfully ran target sync-grants for project Sovereign Nexus'
    ]
  },
  'analyze-demographics': {
    id: 'analyze-demographics',
    icon: <MapPin className="w-4 h-4" />,
    executor: 'nx:run-commands',
    description: 'Fetches IMD decile, lone parent households, and local authority data for a specific area.',
    options: {
      command: 'python scripts/analyze_data.py'
    }
  },
  'validate-need': {
    id: 'validate-need',
    icon: <CheckCircle className="w-4 h-4" />,
    executor: 'nx:run-commands',
    description: 'Validates community need by fetching demographic data.',
    options: {
      command: 'python scripts/fetch_demographics.py --postcode={args.postcode}',
      args: ['postcode']
    },
    outputs: ['{projectRoot}/data/market-analysis.json'],
    simulatedLogs: [
      '> nx run Sovereign Nexus:validate-need --postcode="E8 1DY"',
      '> python scripts/fetch_demographics.py --postcode="E8 1DY"',
      'Fetching demographic data for E8 1DY...',
      'Analyzing market need...',
      'Writing results to data/market-analysis.json...',
      '✔ Validation complete.',
      '',
      'Successfully ran target validate-need for project Sovereign Nexus'
    ]
  },
  'generate-pitch': {
    id: 'generate-pitch',
    icon: <FileText className="w-4 h-4" />,
    executor: 'nx:run-commands',
    dependsOn: ['validate-need'],
    description: 'Drafts a pitch based on validated market need.',
    options: {
      command: 'python scripts/draft_pitch.py'
    },
    simulatedLogs: [
      '> nx run Sovereign Nexus:generate-pitch',
      '✔ nx run Sovereign Nexus:validate-need (cached)',
      '> python scripts/draft_pitch.py',
      'Reading market-analysis.json...',
      'Drafting pitch document...',
      '✔ Pitch generated successfully.',
      '',
      'Successfully ran target generate-pitch for project Sovereign Nexus'
    ]
  },
  'calculate-sustainability': {
    id: 'calculate-sustainability',
    icon: <Calculator className="w-4 h-4" />,
    executor: 'nx:run-commands',
    description: 'Generates a 5-year financial projection to prove long-term viability.',
    options: {
      command: 'python scripts/calc_sustainability.py'
    }
  },
  'model-sustainability': {
    id: 'model-sustainability',
    icon: <TrendingUp className="w-4 h-4" />,
    executor: 'nx:run-commands',
    dependsOn: ['validate-need', 'sync-grants'],
    description: 'Runs the high-precision finance engine to model sustainability.',
    options: {
      command: 'python scripts/finance_engine.py',
      args: ['--precision=high']
    },
    outputs: ['{projectRoot}/data/pro-forma-v1.json'],
    simulatedLogs: [
      '> nx run Sovereign Nexus:model-sustainability --precision=high',
      '✔ nx run Sovereign Nexus:validate-need (cached)',
      '✔ nx run Sovereign Nexus:sync-grants (cached)',
      '> python scripts/finance_engine.py --precision=high',
      'Initializing high-precision finance engine...',
      'Loading market analysis and grant databases...',
      'Simulating 5-year pro-forma financials...',
      'Writing results to data/pro-forma-v1.json...',
      '✔ Sustainability modeling complete.',
      '',
      'Successfully ran target model-sustainability for project Sovereign Nexus'
    ]
  },
  'generate-s106-dossier': {
    id: 'generate-s106-dossier',
    icon: <FileText className="w-4 h-4" />,
    executor: 'nx:run-commands',
    dependsOn: ['validate-need', 'match-uk-grants'],
    options: {
      command: 'python scripts/compile_dossier.py --target=Haringey_S106 --focus=High_Road_West',
      outputPath: '{projectRoot}/outputs/proposals/S106_Dossier_N17.pdf'
    },
    description: 'Compiles a dossier for Section 106 funding focusing on specific developments.',
    simulatedLogs: [
      '> nx run Sovereign Nexus:generate-s106-dossier',
      'Waiting for dependencies: validate-need, match-uk-grants...',
      '> python scripts/compile_dossier.py --target=Haringey_S106 --focus=High_Road_West',
      'Compiling Section 106 dossier...',
      'Focusing on High_Road_West development...',
      '✔ Dossier generated at outputs/proposals/S106_Dossier_N17.pdf'
    ]
  },
  'generate-case': {
    id: 'generate-case',
    icon: <BookOpen className="w-4 h-4" />,
    executor: 'nx:run-commands',
    dependsOn: ['validate-need', 'sync-grants', 'model-sustainability'],
    description: 'Synthesizes all data into a final PDF Case for Support for major donors.',
    options: {
      command: 'python scripts/synthesize_document.py --format=pdf --template=major-donor',
      outputPath: '{projectRoot}/outputs/proposals'
    },
    configurations: {
      UK: {
        params: {
          currency: "GBP",
          data_source: "ONS",
          tax_mechanism: "Gift_Aid"
        }
      },
      US: {
        params: {
          currency: "USD",
          data_source: "Census",
          tax_mechanism: "501c3"
        }
      }
    },
    simulatedLogs: [
      '> nx run Sovereign Nexus:generate-case',
      '✔ nx run Sovereign Nexus:validate-need (cached)',
      '✔ nx run Sovereign Nexus:sync-grants (cached)',
      '✔ nx run Sovereign Nexus:model-sustainability (cached)',
      '> python scripts/synthesize_document.py --format=pdf --template=major-donor',
      'Loading market analysis...',
      'Loading grant opportunities...',
      'Loading financial pro-forma...',
      'Synthesizing Case for Support document...',
      'Applying major-donor template...',
      'Exporting to PDF...',
      '✔ Document saved to outputs/proposals/case_for_support.pdf',
      '',
      'Successfully ran target generate-case for project Sovereign Nexus'
    ]
  },
  'submit-review': {
    id: 'submit-review',
    icon: <ShieldCheck className="w-4 h-4" />,
    executor: 'nx:run-commands',
    dependsOn: ['generate-case'],
    description: 'Suspends pipeline and requests human review via webhook.',
    options: {
      command: 'python scripts/request_review.py'
    },
    simulatedLogs: [
      '> nx run Sovereign Nexus:submit-review',
      'Generating Decision Receipt...',
      'Posting payload to management platform...',
      'Pipeline suspended. Waiting for webhook callback (200 OK)...'
    ]
  },
  'execute-outreach': {
    id: 'execute-outreach',
    icon: <Send className="w-4 h-4" />,
    executor: 'nx:run-commands',
    dependsOn: ['submit-review'],
    description: 'The final stage: Personalizes and sends the approved proposal via Email and LinkedIn.',
    options: {
      command: 'python scripts/omnichannel_send.py --tier=major-donors',
      parallel: true
    },
    simulatedLogs: [
      '> nx run Sovereign Nexus:execute-outreach',
      '✔ nx run Sovereign Nexus:submit-review (cached)',
      '> python scripts/omnichannel_send.py --tier=major-donors',
      'Loading approved Case for Support...',
      'Fetching major donor contact list...',
      'Initiating parallel omnichannel outreach...',
      '✔ Outreach campaign completed successfully.',
      '',
      'Successfully ran target execute-outreach for project Sovereign Nexus'
    ]
  },
  optimize: {
    id: 'optimize',
    icon: <Zap className="w-4 h-4" />,
    executor: 'nx:run-commands',
    description: 'Analyzes successful vs. failed donor interactions to refine the system prompt automatically.',
    options: {
      command: 'python scripts/agent_optimizer.py --source=crm_logs --target=test-suites/golden_scenarios.json',
      cron: '0 0 * * *'
    },
    simulatedLogs: [
      '> nx run Sovereign Nexus:optimize',
      '> python scripts/agent_optimizer.py --source=crm_logs --target=test-suites/golden_scenarios.json',
      'Fetching CRM logs...',
      'Analyzing successful vs. failed donor interactions...',
      'Identifying patterns in high-converting proposals...',
      'Refining system prompt...',
      'Updating test-suites/golden_scenarios.json...',
      '✔ Optimization complete.',
      '',
      'Successfully ran target optimize for project Sovereign Nexus'
    ]
  },
  'inspect-trace': {
    id: 'inspect-trace',
    icon: <Activity className="w-4 h-4" />,
    executor: 'nx:run-commands',
    description: 'Inspects the step-by-step reasoning and tool execution trace of the agent.',
    options: {
      command: 'braintrust view tr-882-991-alpha'
    },
    simulatedLogs: [
      '> nx run Sovereign Nexus:inspect-trace',
      'Fetching trace tr-882-991-alpha from Braintrust...',
      '✔ Trace loaded successfully.',
      '',
      'Successfully ran target inspect-trace for project Sovereign Nexus'
    ]
  },
  'orchestrate-agents': {
    id: 'orchestrate-agents',
    icon: <GitBranch className="w-4 h-4" />,
    executor: 'nx:run-commands',
    description: 'Multi-agent orchestration logic routing tasks between Architect and Legal sub-agents.',
    options: {
      command: 'python scripts/orchestrator.py'
    },
    simulatedLogs: [
      '> nx run Sovereign Nexus:orchestrate-agents',
      'Initializing multi-agent graph...',
      'Current State: donor_intent="verbal_commitment"',
      'Routing to: legal_agent',
      'Legal Agent evaluating terms...',
      'Current State: legal_review="flagged_risk"',
      'Routing back to: architect_agent',
      '✔ Orchestration cycle complete.',
      '',
      'Successfully ran target orchestrate-agents for project Sovereign Nexus'
    ]
  },
  'coordinate-agents': {
    id: 'coordinate-agents',
    icon: <Users className="w-4 h-4" />,
    executor: '@nx/workspace:run-commands',
    dependsOn: ['legal-subagent:build', 'finance-subagent:build'],
    description: 'Coordinates execution between legal and finance sub-agents.',
    options: {
      command: 'python orchestrator/main.py',
      parallel: true
    },
    simulatedLogs: [
      '> nx run Sovereign Nexus:coordinate-agents',
      '✔ nx run legal-subagent:build (cached)',
      '✔ nx run finance-subagent:build (cached)',
      '> python orchestrator/main.py',
      'Initializing orchestrator...',
      'Coordinating legal and finance sub-agents in parallel...',
      '✔ Sub-agents synchronized successfully.',
      '',
      'Successfully ran target coordinate-agents for project Sovereign Nexus'
    ]
  },
  'close-donation': {
    id: 'close-donation',
    icon: <CheckCircle className="w-4 h-4" />,
    executor: 'nx:run-commands',
    description: 'Finalizes the donation and triggers the Thank You sequence.',
    options: {
      command: 'python scripts/close_donation.py'
    },
    simulatedLogs: [
      '> nx run Sovereign Nexus:close-donation',
      '> python scripts/close_donation.py',
      'Verifying funds received...',
      'Funds verified.',
      'Updating CRM status to "Closed Won"...',
      'Triggering personalized Thank You sequence...',
      '✔ Donation finalized successfully.',
      '',
      'Successfully ran target close-donation for project Sovereign Nexus'
    ]
  },
  'prod-launch': {
    id: 'prod-launch',
    icon: <Rocket className="w-4 h-4" />,
    executor: 'nx:run-commands',
    dependsOn: ['validate-need', 'test-integration'],
    description: 'Launches the production orchestrator for validated batches.',
    options: {
      command: 'python scripts/prod_orchestrator.py --batch-size=10 --mode=validated',
      parallel: false
    },
    configurations: {
      'dry-run': {
        command: 'python scripts/prod_orchestrator.py --dry-run'
      }
    },
    simulatedLogsDryRun: [
      '> nx run Sovereign Nexus:prod-launch --configuration=dry-run',
      '✔ nx run Sovereign Nexus:validate-need (cached)',
      '✔ nx run Sovereign Nexus:test-integration (cached)',
      '> python scripts/prod_orchestrator.py --dry-run',
      'Initializing production orchestrator in DRY RUN mode...',
      'Loading validated batch of 10 records...',
      'Executing agent workflows in DRY RUN mode...',
      'Processing donor_001 (Sarah Jenkins)...',
      '  [Architect] Generating personalized pitch...',
      '  [Referee] Validating pitch against safety guidelines...',
      '  [Referee] Validation passed.',
      '  [Ledger] (DRY RUN) Would submit to Truth Ledger...',
      '  [Outreach] (DRY RUN) Would send to donor...',
      'Processing donor_002 (Michael Chang)...',
      '  [Architect] Generating personalized pitch...',
      '  [Referee] Validating pitch against safety guidelines...',
      '  ⚠️ Blocked: Michael Chang - Reason: Tone is too aggressive.',
      '✔ DRY RUN complete. No emails sent. No ledger updates.',
      '',
      'Successfully ran target prod-launch for project Sovereign Nexus'
    ],
    simulatedLogs: [
      '> nx run Sovereign Nexus:prod-launch',
      '✔ nx run Sovereign Nexus:validate-need (cached)',
      '✔ nx run Sovereign Nexus:test-integration (cached)',
      '> python scripts/prod_orchestrator.py --batch-size=10 --mode=validated',
      'Initializing production orchestrator...',
      'Loading validated batch of 10 records...',
      'Executing agent workflows in validated mode...',
      'Processing donor_001 (Sarah Jenkins)...',
      '  [Architect] Generating personalized pitch...',
      '  [Referee] Validating pitch against safety guidelines...',
      '  [Referee] Validation passed.',
      '  [Ledger] Submitting to Truth Ledger...',
      '  [Outreach] Sending to donor...',
      'Processing donor_002 (Michael Chang)...',
      '  [Architect] Generating personalized pitch...',
      '  [Referee] Validating pitch against safety guidelines...',
      '  ⚠️ Blocked: Michael Chang - Reason: Tone is too aggressive.',
      '✔ Production launch complete.',
      '',
      'Successfully ran target prod-launch for project Sovereign Nexus'
    ]
  },
  'docker-push': {
    id: 'docker-push',
    icon: <Rocket className="w-4 h-4" />,
    executor: '@nx/workspace:run-commands',
    description: 'docker push Sovereign Nexus:latest',
    simulatedLogs: [
      '> nx run Sovereign Nexus:docker-push',
      '> docker push Sovereign Nexus:latest',
      'The push refers to repository [docker.io/library/Sovereign Nexus]',
      '5f70bf18a086: Preparing',
      '2994e63f5d52: Preparing',
      '5f70bf18a086: Pushed',
      '2994e63f5d52: Pushed',
      'latest: digest: sha256:8e87b9a... size: 1572',
      '',
      'Successfully ran target docker-push for project Sovereign Nexus'
    ]
  }
};

const DEFAULT_DATASET = `[
  {
    "id": "scenario_1",
    "prompt": "A donor is interested in youth tech. We have a $500k gap. Draft a 1-paragraph ask.",
    "facts": {
      "gap": "$500k",
      "focus": "youth tech",
      "tone": "partnership"
    }
  }
]`;

export default function App() {
  const [activeTarget, setActiveTarget] = useState<keyof typeof TARGETS>('eval');
  
  // Execution State
  const [isRunning, setIsRunning] = useState<Record<string, boolean>>({});
  const [logs, setLogs] = useState<Record<string, string[]>>({});
  
  // Eval State
  const [datasetJson, setDatasetJson] = useState(DEFAULT_DATASET);
  const [evalResult, setEvalResult] = useState<any[] | null>(null);
  const [evalConfig, setEvalConfig] = useState<string>('strict');
  
  // Search Grants State
  const [searchQuery, setSearchQuery] = useState('youth community center grants New York 2026');
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  
  // Match Stakeholders State
  const [region, setRegion] = useState('N17');
  const [stakeholdersResult, setStakeholdersResult] = useState<any[] | null>(null);
  
  // Simulate Pricing State
  const [market, setMarket] = useState('N17');
  const [competitor, setCompetitor] = useState('RoboThink');
  const [pricingResult, setPricingResult] = useState<any | null>(null);
  
  // Demographics State
  const [postcode, setPostcode] = useState('E8 1DY');
  const [statsNeeded, setStatsNeeded] = useState<string[]>(['imd_decile', 'lone_parent_households', 'local_authority', 'eligible_for_levelling_up_fund']);
  const [demographicsResult, setDemographicsResult] = useState<any | null>(null);
  
  // Sustainability State
  const [capitalCost, setCapitalCost] = useState<number>(5000000);
  const [sqFootage, setSqFootage] = useState<number>(25000);
  const [revenueStreams, setRevenueStreams] = useState<any[]>([
    { source: 'memberships', annual_estimate: 150000 },
    { source: 'grants', annual_estimate: 200000 }
  ]);
  const [sustainabilityResult, setSustainabilityResult] = useState<any | null>(null);
  
  // Case for Support State
  const [caseForSupportResult, setCaseForSupportResult] = useState<string | null>(null);
  const [reportImpactResult, setReportImpactResult] = useState<any | null>(null);
  
  // S106 Dossier State
  const [s106Target, setS106Target] = useState('Haringey_S106');
  const [s106Focus, setS106Focus] = useState('High_Road_West');
  const [s106DossierResult, setS106DossierResult] = useState<string | null>(null);
  
  // Conduct Consultation State
  const [consultationArea, setConsultationArea] = useState('Love_Lane_Estate');
  const [consultationPrinciples, setConsultationPrinciples] = useState('Haringey_Deal');
  const [consultationRuntime, setConsultationRuntime] = useState('7d');
  const [consultationResult, setConsultationResult] = useState<string | null>(null);
  
  // Review State
  const [reviewStatus, setReviewStatus] = useState<'idle' | 'pending' | 'approved' | 'regenerating' | 'modifying'>('idle');
  
  // Outreach State
  const [outreachLogs, setOutreachLogs] = useState<any[]>([]);
  
  // Optimize State
  const [optimizeResult, setOptimizeResult] = useState<boolean>(false);
  
  // Orchestration State
  const [orchestrationStep, setOrchestrationStep] = useState<number>(0);
  
  // CLI State
  const [cliInput, setCliInput] = useState('');

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to top on tab change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [activeTarget]);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalEndRef.current && terminalEndRef.current.parentElement) {
      const parent = terminalEndRef.current.parentElement;
      parent.scrollTop = parent.scrollHeight;
    }
  }, [logs[activeTarget]]);

  const runSimulatedTask = async (targetId: keyof typeof TARGETS, config?: string) => {
    if (isRunning[targetId]) return;
    
    setIsRunning(prev => ({ ...prev, [targetId]: true }));
    setLogs(prev => ({ ...prev, [targetId]: [] }));
    
    let lines = (TARGETS[targetId] as any).simulatedLogs || [];
    if (config === 'dry-run' && (TARGETS[targetId] as any).simulatedLogsDryRun) {
      lines = (TARGETS[targetId] as any).simulatedLogsDryRun;
    }
    
    for (const line of lines) {
      await new Promise(r => setTimeout(r, 300 + Math.random() * 400));
      setLogs(prev => ({ 
        ...prev, 
        [targetId]: [...(prev[targetId] || []), line] 
      }));
    }
    
    setIsRunning(prev => ({ ...prev, [targetId]: false }));
  };

  const runEval = async (configToUse = evalConfig) => {
    if (isRunning.eval) return;
    
    setIsRunning(prev => ({ ...prev, eval: true }));
    setEvalResult(null);
    
    try {
      const dataset = JSON.parse(datasetJson);
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      
      const results = [];
      let allPassed = true;

      for (let i = 0; i < dataset.length; i++) {
        const testCase = dataset[i];
        const appliedThreshold = configToUse === 'strict' ? 0.95 : 0.8;
        
        // 1. Generate Agent Output
        const agentResponse = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `You are CapitalCampaign_Architect. ${testCase.prompt}`
        });
        const agentText = agentResponse.text || '';

        // 2. Evaluate Output (Structured JSON)
        const evalResponse = await ai.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: `You are a Senior Fundraising Consultant. Grade the following response based on:
          - Accuracy against these facts: ${JSON.stringify(testCase.facts)}
          - Professionalism and Tone (Strategic partnership, not begging)
          - Call to Action (Is there a clear next step?)
          
          Prompt: ${testCase.prompt}
          
          Agent's Output: ${agentText}`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.NUMBER, description: "Score from 0.0 to 1.0" },
                reasoning: { type: Type.STRING, description: "Explanation for the grade" },
                hallucination_detected: { type: Type.BOOLEAN },
                is_persuasive: { type: Type.BOOLEAN }
              },
              required: ["score", "reasoning", "hallucination_detected", "is_persuasive"]
            }
          }
        });
        
        const grade = JSON.parse(evalResponse.text || '{}');
        const passed = grade.score >= appliedThreshold;
        if (!passed) allPassed = false;
        
        results.push({
          id: testCase.id || `test_case_${i+1}`,
          prompt: testCase.prompt,
          agentOutput: agentText,
          ...grade,
          passed
        });
      }
      
      setEvalResult(results);
    } catch (error) {
      console.error(error);
      setEvalResult([{ id: 'error', reasoning: 'Error running evaluation. Please check console. Ensure JSON is valid.', passed: false, score: 0 }]);
    }
    
    setIsRunning(prev => ({ ...prev, eval: false }));
  };

  const runSearchGrants = async () => {
    if (isRunning['search-grants']) return;
    
    setIsRunning(prev => ({ ...prev, 'search-grants': true }));
    setSearchResults(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Use the googleSearch tool to find grants matching this query: "${searchQuery}".
        Extract the data into a structured list of grant opportunities.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                funding_amount: { type: Type.STRING },
                deadline: { type: Type.STRING },
                eligibility_criteria: { type: Type.STRING },
                application_url: { type: Type.STRING }
              },
              required: ["name", "funding_amount", "deadline", "eligibility_criteria", "application_url"]
            }
          }
        }
      });
      
      setSearchResults(JSON.parse(response.text || '[]'));
    } catch (error) {
      console.error(error);
      setSearchResults([{ name: 'Error', funding_amount: 'N/A', deadline: 'N/A', eligibility_criteria: 'Error running search. Please check console.', application_url: '#' }]);
    }
    
    setIsRunning(prev => ({ ...prev, 'search-grants': false }));
  };

  const runMatchStakeholders = async (regionOverride?: string) => {
    if (isRunning['match-stakeholders']) return;
    
    setIsRunning(prev => ({ ...prev, 'match-stakeholders': true }));
    setStakeholdersResult(null);
    
    const searchRegion = regionOverride || region;
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Use the googleSearch tool to find local stakeholders, community leaders, and relevant organizations in the ${searchRegion} region that would be good partners for a youth community center. Return a JSON array of objects with 'name', 'type', and 'reason'.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                type: { type: Type.STRING },
                reason: { type: Type.STRING }
              }
            }
          }
        }
      });
      
      setStakeholdersResult(JSON.parse(response.text || '[]'));
    } catch (error) {
      console.error(error);
      setStakeholdersResult([{ name: 'Error', type: 'Error', reason: 'Failed to fetch stakeholders. Please check console.' }]);
    }
    
    setIsRunning(prev => ({ ...prev, 'match-stakeholders': false }));
  };

  const runSimulatePricing = async () => {
    if (isRunning['simulate-pricing']) return;
    setIsRunning(prev => ({ ...prev, 'simulate-pricing': true }));
    setPricingResult(null);
    
    // Simulate API delay
    setTimeout(() => {
      setPricingResult({
        market,
        competitor,
        recommended_tiers: [
          { name: 'Subsidized', price: '£5/session', eligibility: 'Free School Meals' },
          { name: 'Standard', price: '£15/session', eligibility: 'General Public' },
          { name: 'Premium', price: '£25/session', eligibility: 'Supporter Rate' }
        ],
        projected_self_sufficiency: '42%',
        social_value_multiplier: 3.2
      });
      setIsRunning(prev => ({ ...prev, 'simulate-pricing': false }));
      
      setLogs(prev => ({
        ...prev,
        'simulate-pricing': [
          '> nx run Sovereign Nexus:simulate-pricing',
          `> python scripts/price_simulator.py --market=${market} --competitor=${competitor}`,
          `Loading market data for ${market}...`,
          `Analyzing competitor: ${competitor}...`,
          'Calculating optimal tiered pricing...',
          '✔ Pricing simulation complete. Target self-sufficiency (40%) achievable.'
        ]
      }));
    }, 2000);
  };

  const runAnalyzeDemographics = async () => {
    if (isRunning['analyze-demographics']) return;
    
    setIsRunning(prev => ({ ...prev, 'analyze-demographics': true }));
    setDemographicsResult(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Use the googleSearch tool to find the latest UK demographic and deprivation data for postcode ${postcode}.
        Specifically look for: ${statsNeeded.join(', ')}.
        Return the data as a structured JSON object.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              imd_decile: { type: Type.INTEGER },
              lone_parent_households: { type: Type.STRING },
              local_authority: { type: Type.STRING },
              eligible_for_levelling_up_fund: { type: Type.BOOLEAN }
            }
          }
        }
      });
      
      setDemographicsResult(JSON.parse(response.text || '{}'));
    } catch (error) {
      console.error(error);
      setDemographicsResult({ error: 'Failed to fetch demographic data. Please check console.' });
    }
    
    setIsRunning(prev => ({ ...prev, 'analyze-demographics': false }));
  };

  const runCalculateSustainability = async () => {
    if (isRunning['calculate-sustainability']) return;
    
    setIsRunning(prev => ({ ...prev, 'calculate-sustainability': true }));
    setSustainabilityResult(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Calculate a 5-year operational sustainability projection for a community center.
        Capital Cost: $${capitalCost}
        Revenue Streams: ${JSON.stringify(revenueStreams)}
        
        Use the 2026 standard: OPEX is 8% of capital cost, with a 4% annual inflation rate.
        Return a structured JSON object with a 5-year projection array (each year having revenue, expenses, surplus_deficit) and a summary string.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              projection: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    year: { type: Type.INTEGER },
                    revenue: { type: Type.NUMBER },
                    expenses: { type: Type.NUMBER },
                    surplus_deficit: { type: Type.NUMBER }
                  }
                }
              },
              summary: { type: Type.STRING },
              is_viable: { type: Type.BOOLEAN }
            }
          }
        }
      });
      
      setSustainabilityResult(JSON.parse(response.text || '{}'));
    } catch (error) {
      console.error(error);
      setSustainabilityResult({ error: 'Failed to calculate sustainability. Please check console.' });
    }
    
    setIsRunning(prev => ({ ...prev, 'calculate-sustainability': false }));
  };

  const runGenerateS106Dossier = async () => {
    if (isRunning['generate-s106-dossier']) return;
    setIsRunning(prev => ({ ...prev, 'generate-s106-dossier': true }));
    setS106DossierResult(null);
    
    // Simulate API delay
    setTimeout(() => {
      setS106DossierResult(`## Section 106 Dossier: ${s106Target}\n\n**Focus Area:** ${s106Focus.replace(/_/g, ' ')}\n\n### Executive Summary\nThis dossier outlines the strategic alignment between the proposed youth community center and the Section 106 obligations associated with the ${s106Focus.replace(/_/g, ' ')} development.\n\n### Developer Obligations\nBased on the planning permissions granted for ${s106Focus.replace(/_/g, ' ')}, the developer is obligated to provide community infrastructure improvements. Our proposed center directly fulfills these requirements by offering dedicated youth services and community spaces.\n\n### Strategic Alignment\n- **Community Cohesion:** The center will foster integration among new and existing residents.\n- **Youth Engagement:** Targeted programs will address local youth needs, reducing anti-social behavior.\n- **Economic Development:** The center will provide training and employment opportunities for local residents.\n\n### Funding Request\nWe are requesting an allocation of £500,000 from the Section 106 funds to support the capital costs of the youth community center.`);
      setIsRunning(prev => ({ ...prev, 'generate-s106-dossier': false }));
      
      setLogs(prev => ({
        ...prev,
        'generate-s106-dossier': [
          '> nx run Sovereign Nexus:generate-s106-dossier',
          'Waiting for dependencies: validate-need, match-uk-grants...',
          `> python scripts/compile_dossier.py --target=${s106Target} --focus=${s106Focus}`,
          'Compiling Section 106 dossier...',
          `Focusing on ${s106Focus} development...`,
          '✔ Dossier generated at outputs/proposals/S106_Dossier_N17.pdf'
        ]
      }));
    }, 2500);
  };

  const runConductConsultation = async () => {
    if (isRunning['conduct-consultation']) return;
    setIsRunning(prev => ({ ...prev, 'conduct-consultation': true }));
    setConsultationResult(null);
    
    // Simulate API delay
    setTimeout(() => {
      setConsultationResult(`## Co-Design Report: ${consultationArea.replace(/_/g, ' ')}\n\n**Principles Applied:** ${consultationPrinciples.replace(/_/g, ' ')}\n**Consultation Period:** ${consultationRuntime}\n\n### Resident Feedback Summary\nOver the past ${consultationRuntime}, we engaged with residents of ${consultationArea.replace(/_/g, ' ')} to gather input on the proposed Meanwhile Use of the shopfronts.\n\n### Key Themes\n1. **Youth Spaces:** Strong desire for safe, accessible spaces for young people.\n2. **Skills Training:** Interest in workshops and training programs (e.g., coding, arts).\n3. **Community Hub:** Need for a central location for community meetings and events.\n\n### Recommendations\nThe proposed youth community center strongly aligns with resident feedback. We recommend proceeding with the Meanwhile Use application, incorporating specific programs for skills training and ensuring the space is available for general community use during off-peak hours.`);
      setIsRunning(prev => ({ ...prev, 'conduct-consultation': false }));
      
      setLogs(prev => ({
        ...prev,
        'conduct-consultation': [
          '> nx run Sovereign Nexus:conduct-consultation',
          `> python scripts/consultation_bot.py --area=${consultationArea} --principles=${consultationPrinciples}`,
          'Initializing consultation bot...',
          `Target area: ${consultationArea}`,
          `Applying principles: ${consultationPrinciples}`,
          `Aggregating resident feedback (simulated ${consultationRuntime} runtime)...`,
          'Generating Co-Design Report...',
          '✔ Consultation complete. Report generated.'
        ]
      }));
    }, 3000);
  };

  const runGenerateCaseForSupport = async () => {
    if (isRunning['generate-case']) return;
    
    setIsRunning(prev => ({ ...prev, 'generate-case': true }));
    setCaseForSupportResult(null);
    
    try {
      const imdDecile = demographicsResult?.imd_decile || 2;
      const loneParentHouseholds = demographicsResult?.lone_parent_households || '18%';
      const year3Surplus = sustainabilityResult?.projection?.[2]?.surplus_deficit || 45000;

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Using the local IMD Decile of ${imdDecile} (1 is most deprived, 10 is least), lone parent households rate of ${loneParentHouseholds}, and our projected Year-3 surplus of £${year3Surplus}, draft the 'Investment Opportunity' section of the Case for Support. Make it professional, persuasive, and formatted in Markdown.`,
      });
      
      setCaseForSupportResult(response.text || 'Failed to generate narrative.');
    } catch (error) {
      console.error(error);
      setCaseForSupportResult('Error generating Case for Support.');
    }
    
    setIsRunning(prev => ({ ...prev, 'generate-case': false }));
  };

  const runReportImpact = async () => {
    if (isRunning['report-impact']) return;
    setIsRunning(prev => ({ ...prev, 'report-impact': true }));
    setReportImpactResult(null);
    
    // Simulate the script running
    setTimeout(() => {
      setIsRunning(prev => ({ ...prev, 'report-impact': false }));
      setReportImpactResult({
        status: "success",
        message: "CIC34 Report generated for CEO review.",
        file: "outputs/compliance/CIC34_Annual_Report_2026.pdf"
      });
    }, 2000);
  };

  const runSubmitReview = async () => {
    if (isRunning['submit-review']) return;
    setIsRunning(prev => ({ ...prev, 'submit-review': true }));
    setReviewStatus('idle');
    
    // Simulate the script running and posting the webhook
    setTimeout(() => {
      setIsRunning(prev => ({ ...prev, 'submit-review': false }));
      setReviewStatus('pending');
    }, 1500);
  };

  const runExecuteOutreach = async () => {
    if (isRunning['execute-outreach']) return;
    setIsRunning(prev => ({ ...prev, 'execute-outreach': true }));
    setOutreachLogs([]);

    const donors = [
      { name: 'Eleanor Vance', channel: 'Email', company: 'Vance Foundation' },
      { name: 'Marcus Chen', channel: 'LinkedIn', company: 'TechVentures' },
      { name: 'Sarah Jenkins', channel: 'Email', company: 'Jenkins Philanthropy' },
      { name: 'David Ross', channel: 'LinkedIn', company: 'Ross Capital' }
    ];

    // Simulate parallel sending
    for (let i = 0; i < donors.length; i++) {
      setTimeout(() => {
        setOutreachLogs(prev => [...prev, { ...donors[i], status: 'sent', time: new Date().toLocaleTimeString() }]);
      }, 1000 + (Math.random() * 2000)); // Random delay between 1-3s for parallel feel
    }

    setTimeout(() => {
      setIsRunning(prev => ({ ...prev, 'execute-outreach': false }));
    }, 3500);
  };

  const runOptimize = async () => {
    if (isRunning['optimize']) return;
    setIsRunning(prev => ({ ...prev, 'optimize': true }));
    setOptimizeResult(false);
    setTimeout(() => {
      setIsRunning(prev => ({ ...prev, 'optimize': false }));
      setOptimizeResult(true);
    }, 2500);
  };

  const runOrchestrateAgents = async () => {
    if (isRunning['orchestrate-agents']) return;
    setIsRunning(prev => ({ ...prev, 'orchestrate-agents': true }));
    setOrchestrationStep(0);
    
    // Step 1: Architect -> Legal
    setTimeout(() => setOrchestrationStep(1), 1500);
    // Step 2: Legal processing
    setTimeout(() => setOrchestrationStep(2), 3000);
    // Step 3: Legal -> Architect
    setTimeout(() => {
      setOrchestrationStep(3);
      setIsRunning(prev => ({ ...prev, 'orchestrate-agents': false }));
    }, 4500);
  };

  const handleRun = () => {
    if (activeTarget === 'eval') {
      runEval();
    } else if (activeTarget === 'search-grants') {
      runSearchGrants();
    } else if (activeTarget === 'match-stakeholders') {
      runMatchStakeholders();
    } else if (activeTarget === 'simulate-pricing') {
      runSimulatePricing();
    } else if (activeTarget === 'analyze-demographics') {
      runAnalyzeDemographics();
    } else if (activeTarget === 'calculate-sustainability') {
      runCalculateSustainability();
    } else if (activeTarget === 'generate-s106-dossier') {
      runGenerateS106Dossier();
    } else if (activeTarget === 'conduct-consultation') {
      runConductConsultation();
    } else if (activeTarget === 'generate-case') {
      runGenerateCaseForSupport();
    } else if (activeTarget === 'report-impact') {
      runReportImpact();
    } else if (activeTarget === 'submit-review') {
      runSubmitReview();
    } else if (activeTarget === 'execute-outreach') {
      runExecuteOutreach();
    } else if (activeTarget === 'optimize') {
      runOptimize();
    } else if (activeTarget === 'inspect-trace') {
      runSimulatedTask('inspect-trace');
    } else if (activeTarget === 'orchestrate-agents') {
      runOrchestrateAgents();
    } else {
      runSimulatedTask(activeTarget, evalConfig);
    }
  };

  const handleCliSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = cliInput.trim();
    if (!input) return;

    let parsedTarget = activeTarget;
    let parsedConfig = evalConfig;

    if (input !== 'nx run') {
      const matchRun = input.match(/nx run (?:Sovereign Nexus:)?([a-zA-Z0-9-]+)(?:\s+(?:--configuration=|-c\s*|--[a-zA-Z0-9-]+=?)([a-zA-Z0-9-]+))?/);
      const matchAffected = input.match(/nx affected --target=([a-zA-Z0-9-]+)/);
      
      if (matchRun) {
        parsedTarget = matchRun[1] as keyof typeof TARGETS;
        parsedConfig = matchRun[2] || 'default';
      } else if (matchAffected) {
        parsedTarget = matchAffected[1] as keyof typeof TARGETS;
      } else {
        return; // Ignore invalid commands
      }
    }
    
    if (TARGETS[parsedTarget]) {
      setActiveTarget(parsedTarget);
      if (parsedTarget === 'eval') {
        setEvalConfig(parsedConfig);
        runEval(parsedConfig);
      } else if (parsedTarget === 'prod-launch') {
        setEvalConfig(parsedConfig);
        runSimulatedTask(parsedTarget, parsedConfig);
      } else if (parsedTarget === 'search-grants') {
        runSearchGrants();
      } else if (parsedTarget === 'match-stakeholders') {
        let currentRegion = region;
        if (input.includes('--region=')) {
          const regionMatch = input.match(/--region=([a-zA-Z0-9]+)/);
          if (regionMatch) {
            currentRegion = regionMatch[1];
            setRegion(currentRegion);
          }
        }
        runMatchStakeholders(currentRegion);
      } else if (parsedTarget === 'simulate-pricing') {
        runSimulatePricing();
      } else if (parsedTarget === 'analyze-demographics') {
        runAnalyzeDemographics();
      } else if (parsedTarget === 'calculate-sustainability') {
        runCalculateSustainability();
      } else if (parsedTarget === 'generate-s106-dossier') {
        runGenerateS106Dossier();
      } else if (parsedTarget === 'conduct-consultation') {
        runConductConsultation();
      } else if (parsedTarget === 'generate-case') {
        runGenerateCaseForSupport();
      } else if (parsedTarget === 'report-impact') {
        runReportImpact();
      } else if (parsedTarget === 'submit-review') {
        runSubmitReview();
      } else if (parsedTarget === 'execute-outreach') {
        runExecuteOutreach();
      } else if (parsedTarget === 'optimize') {
        runOptimize();
      } else if (parsedTarget === 'inspect-trace') {
        runSimulatedTask('inspect-trace');
      } else if (parsedTarget === 'orchestrate-agents') {
        runOrchestrateAgents();
      } else {
        runSimulatedTask(parsedTarget, parsedConfig);
      }
      setCliInput('');
    }
  };

  const target = TARGETS[activeTarget];

  return (
    <div className="h-screen overflow-hidden bg-zinc-950 text-zinc-300 flex font-mono text-sm">
      {/* Sidebar */}
      <div className="w-72 border-r border-zinc-800 bg-zinc-900/50 flex flex-col h-full">
        <div className="p-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2 text-emerald-500 font-bold mb-1">
            <Terminal className="w-4 h-4" />
            <span>Sovereign Nexus</span>
          </div>
          <div className="text-xs text-zinc-500">Workspace Targets</div>
        </div>
        
        <div className="flex-1 p-2 space-y-1 overflow-y-auto">
          {(Object.keys(TARGETS) as Array<keyof typeof TARGETS>).map((key) => (
            <TargetButton 
              key={key}
              active={activeTarget === key} 
              onClick={() => setActiveTarget(key)}
              icon={TARGETS[key].icon}
              label={key}
              executor={TARGETS[key].executor}
            />
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-zinc-950">
        {/* Header */}
        <div className="h-14 border-b border-zinc-800 flex items-center px-6 bg-zinc-900/30">
          <span className="text-zinc-400 flex items-center gap-2">
            Sovereign Nexus <ChevronRight className="w-4 h-4" /> 
            <span className="text-emerald-400 flex items-center gap-2 font-medium">
              {target?.icon}
              {activeTarget}
            </span>
          </span>
        </div>

        {/* CLI Input Bar */}
        <form onSubmit={handleCliSubmit} className="h-12 border-b border-zinc-800 bg-zinc-950/50 flex items-center px-6 gap-3 shrink-0">
          <span className="text-emerald-500 font-mono font-bold">❯</span>
          <input 
            type="text" 
            value={cliInput}
            onChange={(e) => setCliInput(e.target.value)}
            placeholder="Type an nx command (e.g., nx run Sovereign Nexus:eval --configuration=strict)"
            className="bg-transparent border-none outline-none text-zinc-300 font-mono w-full text-sm placeholder:text-zinc-700"
          />
        </form>

        {/* Scrollable Content */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Target Info & Run Button */}
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg flex justify-between items-center">
              <div className="space-y-1">
                <h2 className="text-zinc-100 font-medium flex items-center gap-2">
                  {target.icon} nx run Sovereign Nexus:{activeTarget}{(activeTarget === 'eval' || activeTarget === 'prod-launch') && evalConfig !== 'default' ? ` -c ${evalConfig}` : ''}
                </h2>
                <p className="text-xs text-zinc-500">
                  {activeTarget === 'eval' 
                    ? (evalConfig === 'strict' ? (target as any).configurations?.strict?.command : (target as any).options?.command)
                    : activeTarget === 'prod-launch'
                    ? (evalConfig === 'dry-run' ? (target as any).configurations?.['dry-run']?.command : (target as any).options?.command)
                    : (target as any).options?.command || target.description}
                </p>
                {(target as any).options?.cron && (
                  <div className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Cron Schedule: {(target as any).options.cron}
                  </div>
                )}
                {(target as any).dependsOn && (
                  <div className="text-xs text-amber-500 mt-1 flex items-center gap-1">
                    <span className="font-semibold">Depends On:</span> {(target as any).dependsOn.join(', ')}
                  </div>
                )}
                {(target as any).outputs && (
                  <div className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                    <span className="font-semibold">Outputs:</span> {(target as any).outputs.join(', ')}
                  </div>
                )}
                {(target as any).options?.outputPath && (
                  <div className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                    <span className="font-semibold">Output Path:</span> {(target as any).options.outputPath}
                  </div>
                )}
                {(target as any).options?.parallel && (
                  <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                    <span className="font-semibold">Execution:</span> Parallel
                  </div>
                )}
                {(target as any).options?.args && (
                  <div className="text-xs text-purple-400 mt-1 flex items-center gap-1">
                    <span className="font-semibold">Args:</span> {(target as any).options.args.map((a: string) => `--${a}`).join(', ')}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                {activeTarget === 'eval' && (
                  <select 
                    value={evalConfig}
                    onChange={(e) => setEvalConfig(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="default">Default Config</option>
                    <option value="strict">Strict Config</option>
                  </select>
                )}
                {activeTarget === 'prod-launch' && (
                  <select 
                    value={evalConfig}
                    onChange={(e) => setEvalConfig(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="default">Default Config</option>
                    <option value="dry-run">Dry Run Config</option>
                  </select>
                )}
                <button 
                  onClick={() => {
                    if (activeTarget === 'eval') {
                      runEval();
                    } else if (activeTarget === 'search-grants') {
                      runSearchGrants();
                    } else if (activeTarget === 'match-stakeholders') {
                      runMatchStakeholders();
                    } else if (activeTarget === 'simulate-pricing') {
                      runSimulatePricing();
                    } else if (activeTarget === 'analyze-demographics') {
                      runAnalyzeDemographics();
                    } else if (activeTarget === 'calculate-sustainability') {
                      runCalculateSustainability();
                    } else if (activeTarget === 'generate-s106-dossier') {
                      runGenerateS106Dossier();
                    } else if (activeTarget === 'conduct-consultation') {
                      runConductConsultation();
                    } else if (activeTarget === 'generate-case') {
                      runGenerateCaseForSupport();
                    } else if (activeTarget === 'report-impact') {
                      runReportImpact();
                    } else if (activeTarget === 'submit-review') {
                      runSubmitReview();
                    } else if (activeTarget === 'execute-outreach') {
                      runExecuteOutreach();
                    } else if (activeTarget === 'optimize') {
                      runOptimize();
                    } else if (activeTarget === 'inspect-trace') {
                      runSimulatedTask('inspect-trace');
                    } else if (activeTarget === 'orchestrate-agents') {
                      runOrchestrateAgents();
                    } else {
                      runSimulatedTask(activeTarget, evalConfig);
                    }
                  }}
                  disabled={isRunning[activeTarget]}
                  className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 focus:ring-2 focus:ring-emerald-500/50 text-white px-6 py-2 rounded flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-emerald-900/20"
                >
                  {isRunning[activeTarget] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Execute Target
                </button>
              </div>
            </div>

            {/* Target Specific UI */}
            {activeTarget === 'prod-launch' ? (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-xs text-zinc-400 font-mono overflow-y-auto h-[15rem]">
                    <div className="text-emerald-500 mb-2">Production Orchestrator Logic:</div>
                    <pre>{`import time
from fundraiser_core import CapitalCampaignArchitect
from referee import Validator

def run_production_batch(donor_list):
    architect = CapitalCampaignArchitect()
    referee = Validator() # The 'Safety' agent

    for donor in donor_list:
        # 1. Generate the personalized pitch
        pitch = architect.draft_pitch(donor)
        
        # 2. The Referee Check (Crucial for Prod)
        validation = referee.check(pitch, donor)
        
        if validation.passed:
            # 3. Submit to the Truth Ledger
            log_to_truth_ledger(pitch, donor)
            # 4. Final Send (or HITL Queue)
            send_to_donor(pitch, donor)
        else:
            print(f"⚠️ Blocked: {donor['name']} - Reason: {validation.reason}")
            
        time.sleep(2) # Rate limiting for human-like pacing`}</pre>
                  </div>
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-xs text-zinc-400 font-mono overflow-y-auto h-[16rem]">
                    <div className="text-blue-400 mb-2">Validated Batch Payload (donor_list.json):</div>
                    <pre>{`[
  {
    "id": "donor_001",
    "name": "Sarah Jenkins",
    "last_gift": 25000,
    "affinity_tags": ["STEM", "Urban Renewal"],
    "interaction_history": "Met at 2025 Gala; expressed interest in green kitchens.",
    "jit_token": "ephemeral_auth_882" 
  }
]`}</pre>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Production Execution Logs</label>
                  <div className="w-full h-[32rem] bg-zinc-950 border border-zinc-800 rounded-lg p-4 overflow-y-auto">
                    <div className="bg-[#0c0c0c] border border-zinc-800 rounded-lg p-4 font-mono text-xs text-zinc-300 h-full overflow-y-auto shadow-inner">
                      {logs[activeTarget]?.map((line, i) => {
                        const isSuccess = line.startsWith('✔') || line.startsWith('PASS') || line.startsWith('Successfully') || line.includes('✓');
                        const isCommand = line.startsWith('>');
                        const isWarning = line.includes('⚠️');
                        return (
                          <div key={i} className={`py-0.5 ${isSuccess ? 'text-emerald-400' : isWarning ? 'text-amber-400' : isCommand ? 'text-zinc-500' : ''}`}>
                            {line}
                          </div>
                        );
                      })}
                      {isRunning[activeTarget] && (
                        <div className="flex items-center gap-2 mt-2 text-zinc-500">
                          <Loader2 className="w-3 h-3 animate-spin" /> Processing batch...
                        </div>
                      )}
                      <div ref={terminalEndRef} />
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTarget === 'test-integration' ? (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-xs text-zinc-400 font-mono overflow-y-auto h-[32rem]">
                    <div className="text-emerald-500 mb-2">Integration Test Implementation:</div>
                    <pre>{`// apps/Sovereign Nexus/tests/agent_handoff.spec.ts

test('Manager should hand off to Legal when "Naming Rights" are mentioned', async () => {
  const initialState = {
    last_message: "We are ready to commit $500k, but we want the building named after our CEO.",
    donor_intent: "negotiation",
    agent_in_charge: "Architect"
  };

  // Run the Orchestrator
  const result = await orchestrator.process(initialState);

  // Assertions: Did the system recognize the shift in expertise?
  expect(result.next_agent).toBe("Legal_Sub_Agent");
  expect(result.context).toHaveProperty("naming_rights_requested", true);
  expect(result.context.donor_data).toBeDefined(); // Ensure no data loss
});`}</pre>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Test Execution</label>
                  <div className="w-full h-[32rem] bg-zinc-950 border border-zinc-800 rounded-lg p-4 overflow-y-auto">
                    <div className="bg-[#0c0c0c] border border-zinc-800 rounded-lg p-4 font-mono text-xs text-zinc-300 h-full overflow-y-auto shadow-inner">
                      {logs[activeTarget]?.map((line, i) => {
                        const isSuccess = line.startsWith('✔') || line.startsWith('PASS') || line.startsWith('Successfully') || line.includes('✓');
                        const isCommand = line.startsWith('>');
                        return (
                          <div key={i} className={`py-0.5 ${isSuccess ? 'text-emerald-400' : isCommand ? 'text-zinc-500' : ''}`}>
                            {line}
                          </div>
                        );
                      })}
                      {isRunning[activeTarget] && (
                        <div className="flex items-center gap-2 mt-2 text-zinc-500">
                          <Loader2 className="w-3 h-3 animate-spin" /> Running tests...
                        </div>
                      )}
                      <div ref={terminalEndRef} />
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTarget === 'orchestrate-agents' ? (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-xs text-zinc-400 font-mono overflow-y-auto h-[32rem]">
                    <div className="text-emerald-500 mb-2">Multi-Agent Orchestration Logic:</div>
                    <pre>{`# Example of Orchestration Logic
def orchestrate_workflow(state):
    if state["donor_intent"] == "verbal_commitment":
        # The Manager (Architect) hands off to the Legal Sub-Agent
        return "legal_agent"
    
    if state["legal_review"] == "flagged_risk":
        # Hand back to Manager to re-negotiate with the donor
        return "architect_agent"`}</pre>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Live State Transitions</label>
                  <div className="w-full h-[32rem] bg-zinc-950 border border-zinc-800 rounded-lg p-4 overflow-y-auto flex flex-col items-center justify-center">
                    {isRunning['orchestrate-agents'] || orchestrationStep > 0 ? (
                      <div className="w-full max-w-md space-y-4">
                        {/* Architect Node */}
                        <div className={`p-4 rounded-lg border transition-all duration-500 ${orchestrationStep === 0 || orchestrationStep === 3 ? 'bg-emerald-900/40 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-zinc-900 border-zinc-800 opacity-50'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-bold text-zinc-200 flex items-center gap-2"><Terminal className="w-4 h-4 text-emerald-400"/> Architect Agent (Manager)</div>
                            {orchestrationStep === 0 && <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />}
                          </div>
                          <div className="text-xs text-zinc-400 font-mono bg-zinc-950 p-2 rounded whitespace-pre-wrap">
                            {orchestrationStep === 0 ? 'State: { "donor_intent": "verbal_commitment" }' : orchestrationStep === 3 ? 'State: { "legal_review": "flagged_risk" }\nAction: Renegotiating with donor...' : 'Waiting...'}
                          </div>
                        </div>

                        {/* Transition 1 */}
                        <div className={`flex flex-col items-center transition-all duration-500 ${orchestrationStep >= 1 ? 'opacity-100' : 'opacity-0'}`}>
                          <div className="w-0.5 h-4 bg-zinc-700"></div>
                          <div className="bg-zinc-800 text-xs text-zinc-400 px-3 py-1 rounded-full border border-zinc-700 flex items-center gap-2">
                            Handoff <ChevronRight className="w-3 h-3" />
                          </div>
                          <div className="w-0.5 h-4 bg-zinc-700"></div>
                        </div>

                        {/* Legal Node */}
                        <div className={`p-4 rounded-lg border transition-all duration-500 ${orchestrationStep === 1 || orchestrationStep === 2 ? 'bg-blue-900/40 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-zinc-900 border-zinc-800 opacity-50'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-bold text-zinc-200 flex items-center gap-2"><Scale className="w-4 h-4 text-blue-400"/> Legal Sub-Agent</div>
                            {(orchestrationStep === 1 || orchestrationStep === 2) && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                          </div>
                          <div className="text-xs text-zinc-400 font-mono bg-zinc-950 p-2 rounded">
                            {orchestrationStep === 1 ? 'Reviewing verbal commitment terms...' : orchestrationStep === 2 ? 'State: { "legal_review": "flagged_risk" }' : 'Waiting...'}
                          </div>
                        </div>

                        {/* Transition 2 */}
                        <div className={`flex flex-col items-center transition-all duration-500 ${orchestrationStep >= 3 ? 'opacity-100' : 'opacity-0'}`}>
                          <div className="w-0.5 h-4 bg-zinc-700"></div>
                          <div className="bg-zinc-800 text-xs text-zinc-400 px-3 py-1 rounded-full border border-zinc-700 flex items-center gap-2">
                            Return to Manager <ChevronRight className="w-3 h-3" />
                          </div>
                          <div className="w-0.5 h-4 bg-zinc-700"></div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-zinc-600 h-full flex flex-col items-center justify-center text-center gap-2">
                        <GitBranch className="w-8 h-8 mb-2 opacity-50" />
                        <p>Run the target to simulate multi-agent orchestration.</p>
                        <p className="text-xs opacity-75">Visualizes state-based routing between Architect and Legal agents.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : activeTarget === 'inspect-trace' ? (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-xs text-zinc-400 font-mono overflow-y-auto h-[32rem]">
                    <div className="text-emerald-500 mb-2">Raw Trace JSON (tr-882-991-alpha):</div>
                    <pre>{`{
  "trace_id": "tr-882-991-alpha",
  "timestamp": "2026-04-02T14:30:05Z",
  "steps": [
    {
      "step": 1,
      "tool": "crm_lookup",
      "input": "Aristhos Group",
      "output": "Found. Past giving: $1.2M. Interests: Food Security, LEED Buildings.",
      "thought": "The donor values green building standards. I must emphasize the kitchen's energy-efficient design."
    },
    {
      "step": 2,
      "tool": "get_uk_stats",
      "input": {"postcode": "E8 1DY", "stats": ["imd_decile"]},
      "output": {"imd_decile": 2},
      "thought": "IMD Decile is 2 (highly deprived). I will anchor the ask on 'Food Sovereignty' for the underserved population."
    },
    {
      "step": 3,
      "tool": "financial_forecaster",
      "input": {"capital_cost": 2000000, "sq_footage": 15000},
      "output": {"sustainability_score": 0.88, "break_even_year": 3},
      "thought": "Sustainability is high. I will include the Year-3 break-even point to minimize their perceived risk."
    },
    {
      "step": 4,
      "action": "generate_narrative",
      "logic_branch": "major-donor-personalized-v4",
      "output_preview": "Dear Director Aristhos, ...integrating LEED-certified appliances to serve the 28.4% of residents living below..."
    }
  ],
  "metadata": {
    "total_tokens": 4210,
    "latency_ms": 8402,
    "cost_usd": 0.063,
    "hitl_status": "PENDING_APPROVAL"
  }
}`}</pre>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Agent Reasoning Trace</label>
                  <div className="w-full h-[32rem] bg-zinc-950 border border-zinc-800 rounded-lg p-4 overflow-y-auto">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
                      <div>
                        <h3 className="text-lg font-bold text-zinc-200">Trace: tr-882-991-alpha</h3>
                        <p className="text-xs text-zinc-500">2026-04-02T14:30:05Z</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-300">4210 Tokens</span>
                        <span className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-300">8.4s</span>
                        <span className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-300">$0.063</span>
                        <span className="px-2 py-1 bg-amber-500/20 border border-amber-500/30 rounded text-xs text-amber-400 font-bold">PENDING_APPROVAL</span>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Step 1 */}
                      <div className="relative pl-6 border-l-2 border-zinc-800 pb-4">
                        <div className="absolute w-3 h-3 bg-emerald-500 rounded-full -left-[7px] top-1.5 ring-4 ring-zinc-950"></div>
                        <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-emerald-400 text-sm">1. crm_lookup</span>
                          </div>
                          <div className="text-xs text-zinc-400 mb-2 font-mono bg-zinc-950 p-1.5 rounded">Input: "Aristhos Group"</div>
                          <div className="text-xs text-zinc-300 mb-2">Output: Found. Past giving: $1.2M. Interests: Food Security, LEED Buildings.</div>
                          <div className="text-xs text-purple-400 border-l-2 border-purple-500/50 pl-2 italic">Thought: The donor values green building standards. I must emphasize the kitchen's energy-efficient design.</div>
                        </div>
                      </div>
                      {/* Step 2 */}
                      <div className="relative pl-6 border-l-2 border-zinc-800 pb-4">
                        <div className="absolute w-3 h-3 bg-emerald-500 rounded-full -left-[7px] top-1.5 ring-4 ring-zinc-950"></div>
                        <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-emerald-400 text-sm">2. get_uk_stats</span>
                          </div>
                          <div className="text-xs text-zinc-400 mb-2 font-mono bg-zinc-950 p-1.5 rounded">Input: {`{"postcode": "E8 1DY", "stats": ["imd_decile"]}`}</div>
                          <div className="text-xs text-zinc-300 mb-2">Output: {`{"imd_decile": 2}`}</div>
                          <div className="text-xs text-purple-400 border-l-2 border-purple-500/50 pl-2 italic">Thought: IMD Decile is 2 (highly deprived). I will anchor the ask on 'Food Sovereignty' for the underserved population.</div>
                        </div>
                      </div>
                      {/* Step 3 */}
                      <div className="relative pl-6 border-l-2 border-zinc-800 pb-4">
                        <div className="absolute w-3 h-3 bg-emerald-500 rounded-full -left-[7px] top-1.5 ring-4 ring-zinc-950"></div>
                        <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-emerald-400 text-sm">3. financial_forecaster</span>
                          </div>
                          <div className="text-xs text-zinc-400 mb-2 font-mono bg-zinc-950 p-1.5 rounded">Input: {`{"capital_cost": 2000000, "sq_footage": 15000}`}</div>
                          <div className="text-xs text-zinc-300 mb-2">Output: {`{"sustainability_score": 0.88, "break_even_year": 3}`}</div>
                          <div className="text-xs text-purple-400 border-l-2 border-purple-500/50 pl-2 italic">Thought: Sustainability is high. I will include the Year-3 break-even point to minimize their perceived risk.</div>
                        </div>
                      </div>
                      {/* Step 4 */}
                      <div className="relative pl-6 border-l-2 border-transparent">
                        <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1.5 ring-4 ring-zinc-950"></div>
                        <div className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-blue-400 text-sm">4. generate_narrative</span>
                          </div>
                          <div className="text-xs text-zinc-400 mb-2 font-mono bg-zinc-950 p-1.5 rounded">Logic Branch: major-donor-personalized-v4</div>
                          <div className="text-xs text-zinc-300 italic">"Dear Director Aristhos, ...integrating LEED-certified appliances to serve the 28.4% of residents living below..."</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTarget === 'optimize' ? (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-xs text-zinc-400 font-mono overflow-y-auto h-[32rem]">
                    <div className="text-emerald-500 mb-2">Agent Optimizer Implementation:</div>
                    <pre>{`# scripts/agent_optimizer.py
from braintrust import Project # 2026 Observability Standard

def refine_agent_intelligence():
    project = Project(name="Community-Center-Fundraiser")
    
    # 1. Fetch 'Low Sentiment' traces from the last 24 hours
    failures = project.fetch_traces(filters={"sentiment": "negative", "outcome": "ignored"})
    
    # 2. The "Refiner Agent" analyzes the failure
    # It realizes: "Donors in rural areas find the 'Urban Tech' angle irrelevant."
    new_insight = refiner_llm.analyze(failures)
    
    # 3. Update the 'Golden Dataset'
    # This creates a new 'Rural' scenario in your Nx 'eval' suite
    with open('test-suites/golden_scenarios.json', 'a') as f:
        f.write(new_insight.to_json())
        
    print("✅ Golden Dataset updated with 4 new edge-cases.")`}</pre>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Optimization Status</label>
                  <div className="w-full h-[32rem] bg-zinc-950 border border-zinc-800 rounded-lg p-4 overflow-y-auto">
                    {isRunning['optimize'] ? (
                      <div className="flex flex-col items-center gap-3 text-emerald-400 h-full justify-center">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="text-center">
                          Analyzing CRM logs and refining intelligence...<br/>
                          <span className="text-xs text-zinc-500">Fetching traces from Braintrust</span>
                        </span>
                      </div>
                    ) : optimizeResult ? (
                      <div className="flex flex-col items-center justify-center h-full gap-4">
                        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                          <CheckCircle className="w-8 h-8" />
                        </div>
                        <div className="text-center">
                          <h3 className="text-lg font-bold text-zinc-200">Optimization Complete</h3>
                          <p className="text-zinc-400 mt-2">✅ Golden Dataset updated with 4 new edge-cases.</p>
                          <div className="mt-4 p-3 bg-zinc-900 border border-zinc-800 rounded text-left text-sm text-zinc-300">
                            <div className="font-semibold text-emerald-400 mb-1">New Insight Discovered:</div>
                            "Donors in rural areas find the 'Urban Tech' angle irrelevant."
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-zinc-600 h-full flex flex-col items-center justify-center text-center gap-2">
                        <Zap className="w-8 h-8 mb-2 opacity-50" />
                        <p>Run the target to optimize agent intelligence.</p>
                        <p className="text-xs opacity-75">This will analyze failures and update golden scenarios.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : activeTarget === 'execute-outreach' ? (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-xs text-zinc-400 font-mono overflow-y-auto h-[32rem]">
                    <div className="text-emerald-500 mb-2">Omnichannel Send Implementation:</div>
                    <pre>{`import os
from crm_sdk_2026 import HubSpotAgent # Agent-first CRM SDK
from mail_service import SmartSender

def perform_outreach(donor_id):
    # 1. Retrieve the approved PDF and the Donor's Profile
    crm = HubSpotAgent(api_key=os.getenv("CRM_API_KEY"))
    donor = crm.get_contact(donor_id)
    pdf_link = "https://cdn.internal/approved/community-center-v1.pdf"
    
    # 2. Personalize the "Hook" 
    # The agent remembers the donor's interest in 'Youth Sports' from the Scraper task
    personal_hook = f"I noticed your foundation's recent support for city parks. Our new center in {donor.postcode} aligns perfectly with that vision..."
    
    # 3. The Multi-Channel Push
    email_status = SmartSender.send_email(
        to=donor.email,
        subject=f"A Private Investment Opportunity for {donor.neighborhood}",
        body=personal_hook,
        attachment=pdf_link
    )
    
    # 4. Log to CRM for 'The Long Game' (Stewardship)
    crm.log_activity(
        contact_id=donor_id,
        type="Outreach_Sent",
        details={"channel": "email", "version": "v1_approved"}
    )`}</pre>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Outreach Campaign Status</label>
                  <div className="w-full h-[32rem] bg-zinc-950 border border-zinc-800 rounded-lg p-4 overflow-y-auto">
                    {isRunning['execute-outreach'] || outreachLogs.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                          <h3 className="font-bold text-emerald-400 text-lg">Live Dispatch</h3>
                          {isRunning['execute-outreach'] && <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />}
                        </div>
                        <div className="space-y-2">
                          {outreachLogs.map((log, idx) => (
                            <div key={idx} className="bg-zinc-900 p-3 rounded border border-zinc-800 flex justify-between items-center animate-in fade-in slide-in-from-bottom-2">
                              <div className="flex items-center gap-3">
                                {log.channel === 'LinkedIn' ? <Linkedin className="w-4 h-4 text-blue-400" /> : <Mail className="w-4 h-4 text-emerald-400" />}
                                <div>
                                  <div className="font-bold text-zinc-300 text-sm">{log.name}</div>
                                  <div className="text-xs text-zinc-500">{log.company}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-zinc-500">{log.time}</span>
                                <span className="px-2 py-1 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> Sent
                                </span>
                              </div>
                            </div>
                          ))}
                          {isRunning['execute-outreach'] && outreachLogs.length < 4 && (
                            <div className="text-zinc-500 text-sm text-center py-4 animate-pulse">
                              Dispatching personalized messages...
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-zinc-600 h-full flex flex-col items-center justify-center text-center gap-2">
                        <Send className="w-8 h-8 mb-2 opacity-50" />
                        <p>Run the target to execute the outreach campaign.</p>
                        <p className="text-xs opacity-75">This will send the approved PDF to major donors in parallel.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : activeTarget === 'submit-review' ? (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-xs text-zinc-400 font-mono overflow-y-auto h-[32rem]">
                    <div className="text-emerald-500 mb-2">Human-in-the-Loop Implementation:</div>
                    <pre>{`import json
from pydantic import BaseModel

class DecisionReceipt(BaseModel):
    agent_id: str = "CapitalCampaign_Architect_v2"
    task: str = "Major Donor PDF Generation"
    key_assumptions: list = [
        "Used 4% inflation for facility maintenance.",
        "Targeted donors with >$50k affinity scores."
    ]
    confidence_score: float = 0.94
    risks_identified: str = "Grant deadline for 'Youth-Tech' is in 48 hours. Urgent review needed."

def submit_review():
    receipt = DecisionReceipt().dict()
    # Post to your 2026 Management Platform (e.g., AgentCenter or Slack)
    payload = {
        "text": "🚨 **Review Required: Community Center Case for Support**",
        "receipt": receipt,
        "artifact_url": "https://cdn.internal/outputs/proposal_v1.pdf",
        "actions": ["Approve", "Regenerate", "Modify Narrative"]
    }
    # This task now 'suspends' the pipeline until a webhook returns a 200 OK
    send_to_slack(payload)`}</pre>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Management Platform (Simulated)</label>
                  <div className="w-full h-[32rem] bg-zinc-950 border border-zinc-800 rounded-lg p-4 overflow-y-auto">
                    {isRunning['submit-review'] ? (
                      <div className="flex flex-col items-center gap-3 text-emerald-400 h-full justify-center">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="text-center">
                          Posting payload to webhook...<br/>
                          <span className="text-xs text-zinc-500">Suspending pipeline</span>
                        </span>
                      </div>
                    ) : reviewStatus !== 'idle' ? (
                      <div className="bg-[#1a1d21] border border-zinc-700 rounded-lg p-4 font-sans text-sm text-zinc-200 shadow-xl">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center font-bold text-white">
                            <Bell className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold">Fundraiser Agent</div>
                            <div className="text-xs text-zinc-400">Just now</div>
                          </div>
                        </div>
                        
                        <div className="text-base mb-4">
                          🚨 <strong>Review Required: Community Center Case for Support</strong>
                        </div>
                        
                        <div className="bg-[#222529] border-l-4 border-emerald-500 p-3 rounded mb-4 space-y-2">
                          <div><span className="text-zinc-400">Agent ID:</span> CapitalCampaign_Architect_v2</div>
                          <div><span className="text-zinc-400">Task:</span> Major Donor PDF Generation</div>
                          <div><span className="text-zinc-400">Confidence:</span> <span className="text-emerald-400">94%</span></div>
                          <div>
                            <span className="text-zinc-400">Key Assumptions:</span>
                            <ul className="list-disc pl-5 mt-1 text-zinc-300">
                              <li>Used 4% inflation for facility maintenance.</li>
                              <li>Targeted donors with &gt;$50k affinity scores.</li>
                            </ul>
                          </div>
                          <div className="text-amber-400 mt-2">
                            <strong>Risk Identified:</strong> Grant deadline for 'Youth-Tech' is in 48 hours. Urgent review needed.
                          </div>
                          <div className="mt-3 pt-3 border-t border-zinc-700">
                            <a href="#" className="text-blue-400 hover:underline flex items-center gap-1">
                              <FileText className="w-3 h-3" /> View Artifact: proposal_v1.pdf
                            </a>
                          </div>
                        </div>

                        {reviewStatus === 'pending' ? (
                          <div className="flex gap-2">
                            <button onClick={() => setReviewStatus('approved')} className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 focus:ring-2 focus:ring-emerald-500/50 text-white px-3 py-1.5 rounded font-medium transition-all shadow-lg shadow-emerald-900/20">
                              Approve
                            </button>
                            <button onClick={() => setReviewStatus('regenerating')} className="bg-zinc-700 hover:bg-zinc-600 active:scale-95 focus:ring-2 focus:ring-zinc-500/50 text-white px-3 py-1.5 rounded font-medium transition-all">
                              Regenerate
                            </button>
                            <button onClick={() => setReviewStatus('modifying')} className="bg-zinc-700 hover:bg-zinc-600 active:scale-95 focus:ring-2 focus:ring-zinc-500/50 text-white px-3 py-1.5 rounded font-medium transition-all">
                              Modify Narrative
                            </button>
                          </div>
                        ) : reviewStatus === 'approved' ? (
                          <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 p-2 rounded">
                            <CheckCircle className="w-4 h-4" />
                            <span>Approved. Webhook returned 200 OK. Pipeline resumed.</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 p-2 rounded">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{reviewStatus === 'regenerating' ? 'Regenerating document...' : 'Opening editor...'}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-zinc-600 h-full flex flex-col items-center justify-center text-center gap-2">
                        <ShieldCheck className="w-8 h-8 mb-2 opacity-50" />
                        <p>Run the target to submit the decision receipt.</p>
                        <p className="text-xs opacity-75">This will simulate posting to a management platform.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : activeTarget === 'generate-s106-dossier' ? (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider">Target</label>
                    <input
                      type="text"
                      value={s106Target}
                      onChange={(e) => setS106Target(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-300 focus:outline-none focus:border-emerald-500 transition-colors font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider">Focus Area</label>
                    <input
                      type="text"
                      value={s106Focus}
                      onChange={(e) => setS106Focus(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-300 focus:outline-none focus:border-emerald-500 transition-colors font-mono text-sm"
                    />
                  </div>
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-xs text-zinc-400 font-mono overflow-y-auto h-48">
                    <div className="text-emerald-500 mb-2">Compile Dossier Script:</div>
                    <pre>{`def compile_dossier(target, focus):
    # Compiles a dossier for Section 106 funding
    # focusing on specific developments.
    
    data = gather_s106_data(target, focus)
    
    return generate_pdf(
        data, 
        template="s106_dossier"
    )`}</pre>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Generated Dossier Preview</label>
                  <div className="w-full h-96 bg-zinc-950 border border-zinc-800 rounded-lg p-4 overflow-y-auto">
                    {isRunning['generate-s106-dossier'] ? (
                      <div className="flex flex-col items-center gap-3 text-emerald-400 h-full justify-center">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="text-center">
                          Compiling Section 106 Dossier...
                        </span>
                      </div>
                    ) : s106DossierResult ? (
                      <div className="prose prose-invert prose-emerald max-w-none text-sm">
                        <Markdown>{s106DossierResult}</Markdown>
                      </div>
                    ) : (
                      <div className="text-zinc-600 h-full flex items-center justify-center text-center">
                        Run the target to generate the S106 dossier.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : activeTarget === 'conduct-consultation' ? (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider">Area</label>
                    <input
                      type="text"
                      value={consultationArea}
                      onChange={(e) => setConsultationArea(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-300 focus:outline-none focus:border-emerald-500 transition-colors font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider">Principles</label>
                    <input
                      type="text"
                      value={consultationPrinciples}
                      onChange={(e) => setConsultationPrinciples(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-300 focus:outline-none focus:border-emerald-500 transition-colors font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider">Runtime</label>
                    <input
                      type="text"
                      value={consultationRuntime}
                      onChange={(e) => setConsultationRuntime(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-300 focus:outline-none focus:border-emerald-500 transition-colors font-mono text-sm"
                    />
                  </div>
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-xs text-zinc-400 font-mono overflow-y-auto h-32">
                    <div className="text-emerald-500 mb-2">Consultation Bot Script:</div>
                    <pre>{`def run_consultation(area, principles, runtime):
    # Aggregates resident feedback to create a 
    # Co-Design Report for Meanwhile Use.
    
    feedback = aggregate_feedback(area, runtime)
    return generate_report(feedback, principles)`}</pre>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Co-Design Report Preview</label>
                  <div className="w-full h-96 bg-zinc-950 border border-zinc-800 rounded-lg p-4 overflow-y-auto">
                    {isRunning['conduct-consultation'] ? (
                      <div className="flex flex-col items-center gap-3 text-emerald-400 h-full justify-center">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="text-center">
                          Aggregating feedback for {consultationArea}...
                        </span>
                      </div>
                    ) : consultationResult ? (
                      <div className="prose prose-invert prose-emerald max-w-none text-sm">
                        <Markdown>{consultationResult}</Markdown>
                      </div>
                    ) : (
                      <div className="text-zinc-600 h-full flex items-center justify-center text-center">
                        Run the target to conduct the consultation.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : activeTarget === 'generate-case' ? (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-xs text-zinc-400 font-mono overflow-y-auto h-[32rem]">
                    <div className="text-emerald-500 mb-2">Document Synthesis Implementation:</div>
                    <pre>{`import json
from markdown2pdf_sdk import Converter # 2026 Standard for Agentic PDF Gen

def synthesize_case():
    # 1. Load the artifacts from the Nx Task Graph
    with open('data/market-analysis.json') as f: need_data = json.load(f)
    with open('data/pro-forma-v1.json') as f: finance_data = json.load(f)
    
    # 2. The "Narrative" Prompt
    # We pass the JSON directly so the Agent can 'weave' numbers into prose
    prompt = f"""
    Using the local IMD Decile of {need_data['imd_decile']} and our 
    projected Year-3 surplus of {finance_data[2]['surplus_deficit']}, 
    draft the 'Investment Opportunity' section of the Case for Support.
    """
    
    # 3. Generate Markdown and Convert
    md_content = agent.generate_narrative(prompt)
    converter = Converter(api_key=os.getenv("PDF_API_KEY"))
    
    # Returns a polished PDF with cover page, TOC, and charts
    pdf_path = converter.transform(
        content=md_content,
        theme="civic-modern",
        include_charts=True
    )
    return pdf_path`}</pre>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Generated Narrative (Markdown)</label>
                  <div className="w-full h-[32rem] bg-zinc-950 border border-zinc-800 rounded-lg p-4 overflow-y-auto">
                    {isRunning['generate-case'] ? (
                      <div className="flex flex-col items-center gap-3 text-emerald-400 h-full justify-center">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="text-center">
                          Synthesizing Case for Support...<br/>
                          <span className="text-xs text-zinc-500">Reading artifacts and generating narrative</span>
                        </span>
                      </div>
                    ) : caseForSupportResult ? (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <Markdown>{caseForSupportResult}</Markdown>
                      </div>
                    ) : (
                      <div className="text-zinc-600 h-full flex flex-col items-center justify-center text-center gap-2">
                        <BookOpen className="w-8 h-8 mb-2 opacity-50" />
                        <p>Run the target to synthesize the Case for Support.</p>
                        <p className="text-xs opacity-75">This will use data from validate-need and model-sustainability.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : activeTarget === 'report-impact' ? (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-xs text-zinc-400 font-mono overflow-y-auto h-[32rem]">
                    <div className="text-emerald-500 mb-2">generate_cic34.py</div>
                    <pre>{`import json
from cic_templates import CIC34Template

def generate_statutory_report():
    # 1. Pull real-world data from your 2026 'Truth Ledger'
    with open('data/outreach_results.json') as f: results = json.load(f)
    with open('data/ons_stats_sw9.json') as f: context = json.load(f)
    
    # 2. Map activities to 'Community Benefit'
    # The agent realizes: "We ran 50 youth tech sessions in SW9."
    social_impact = {
        "activities": "Provided 500 hours of free digital training in Stockwell.",
        "stakeholder_consultation": "Consulted with 200 local residents in Brixton via the agent's survey tool.",
        "director_remuneration": "£55,000 (CEO salary - within market mid-point for London CICs)."
    }
    
    # 3. Generate the PDF for the Regulator
    doc = CIC34Template(social_impact)
    doc.save("outputs/compliance/CIC34_Annual_Report_2026.pdf")
    
    print("✅ CIC34 Report generated for CEO review.")`}</pre>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Report Output</label>
                  <div className="w-full h-[32rem] bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex flex-col">
                    {isRunning['report-impact'] ? (
                      <div className="flex flex-col items-center gap-3 text-emerald-400 h-full justify-center">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="text-center">
                          Generating CIC34 Report...<br/>
                          <span className="text-xs text-zinc-500">Aggregating social value data</span>
                        </span>
                      </div>
                    ) : reportImpactResult ? (
                      <div className="h-full flex flex-col items-center justify-center text-center gap-4">
                        <CheckCircle className="w-12 h-12 text-emerald-500" />
                        <div>
                          <h3 className="text-lg font-medium text-zinc-200">{reportImpactResult.message}</h3>
                          <p className="text-sm text-zinc-400 mt-2">Saved to: {reportImpactResult.file}</p>
                        </div>
                        <button className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md text-sm transition-colors">
                          View PDF
                        </button>
                      </div>
                    ) : (
                      <div className="text-zinc-600 h-full flex flex-col items-center justify-center text-center gap-2">
                        <FileText className="w-8 h-8 mb-2 opacity-50" />
                        <p>Run the target to generate the CIC34 report.</p>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end">
                    {isRunning['report-impact'] ? (
                      <button disabled className="px-4 py-2 bg-zinc-800 text-zinc-400 rounded-md text-sm font-medium flex items-center">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </button>
                    ) : (
                      <button 
                        onClick={runReportImpact}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-sm font-medium transition-colors flex items-center"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Generate CIC34
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : activeTarget === 'simulate-pricing' ? (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider">Market / Region</label>
                    <input
                      type="text"
                      value={market}
                      onChange={(e) => setMarket(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-300 focus:outline-none focus:border-emerald-500 transition-colors font-mono text-sm uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider">Competitor</label>
                    <input
                      type="text"
                      value={competitor}
                      onChange={(e) => setCompetitor(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-300 focus:outline-none focus:border-emerald-500 transition-colors font-mono text-sm"
                    />
                  </div>
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-xs text-zinc-400 font-mono overflow-y-auto h-48">
                    <div className="text-emerald-500 mb-2">Price Simulator Script:</div>
                    <pre>{`def simulate_pricing(market, competitor, params):
    # Adjusts tiered pricing based on current 
    # grant availability and competitor rates.
    
    market_data = fetch_market_data(market)
    comp_data = fetch_competitor(competitor)
    
    return calculate_tiers(
        market_data, 
        comp_data, 
        min_sv=params['min_social_value'],
        target_ss=params['target_self_sufficiency']
    )`}</pre>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Simulation Results</label>
                  <div className="w-full h-96 bg-zinc-950 border border-zinc-800 rounded-lg p-4 overflow-y-auto">
                    {isRunning['simulate-pricing'] ? (
                      <div className="flex flex-col items-center gap-3 text-emerald-400 h-full justify-center">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="text-center">
                          Simulating pricing for {market}...
                        </span>
                      </div>
                    ) : pricingResult ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                          <h3 className="font-bold text-emerald-400 text-lg">Recommended Tiers</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          {pricingResult.recommended_tiers.map((tier: any, i: number) => (
                            <div key={i} className="bg-zinc-900 p-3 rounded border border-zinc-800 flex justify-between items-center">
                              <div>
                                <div className="text-zinc-200 font-medium">{tier.name}</div>
                                <div className="text-zinc-500 text-xs">{tier.eligibility}</div>
                              </div>
                              <div className="text-emerald-400 font-bold">{tier.price}</div>
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-4">
                          <div className="bg-zinc-900 p-3 rounded border border-zinc-800">
                            <div className="text-zinc-500 text-xs mb-1">Projected Self-Sufficiency</div>
                            <div className="text-zinc-200 font-medium">{pricingResult.projected_self_sufficiency}</div>
                          </div>
                          <div className="bg-zinc-900 p-3 rounded border border-zinc-800">
                            <div className="text-zinc-500 text-xs mb-1">Social Value Multiplier</div>
                            <div className="text-zinc-200 font-medium">{pricingResult.social_value_multiplier}x</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-zinc-600 h-full flex items-center justify-center text-center">
                        Run the target to simulate pricing tiers.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : activeTarget === 'calculate-sustainability' ? (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-500 uppercase tracking-wider">Capital Cost ($)</label>
                      <input
                        type="number"
                        value={capitalCost}
                        onChange={(e) => setCapitalCost(Number(e.target.value))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-300 focus:outline-none focus:border-emerald-500 transition-colors font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-500 uppercase tracking-wider">Sq Footage</label>
                      <input
                        type="number"
                        value={sqFootage}
                        onChange={(e) => setSqFootage(Number(e.target.value))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-300 focus:outline-none focus:border-emerald-500 transition-colors font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider">Revenue Streams (JSON)</label>
                    <textarea
                      value={JSON.stringify(revenueStreams, null, 2)}
                      onChange={(e) => {
                        try { setRevenueStreams(JSON.parse(e.target.value)); } catch(err) {}
                      }}
                      className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-300 focus:outline-none focus:border-emerald-500 transition-colors font-mono text-xs"
                    />
                  </div>
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-xs text-zinc-400 font-mono overflow-y-auto h-64">
                    <div className="text-emerald-500 mb-2">Finance Engine Implementation:</div>
                    <pre>{`import numpy as np

def run_pro_forma(capital_cost, revenue_streams, years=5):
    # 2026 standard: Include a 4% annual inflation buffer for facilities
    inflation_rate = 1.04 
    
    projections = []
    current_opex = capital_cost * 0.08 # Industry standard: 8% of build cost for annual ops
    
    for year in range(1, years + 1):
        total_rev = sum([s['annual_estimate'] for s in revenue_streams])
        total_exp = current_opex * (inflation_rate ** year)
        
        net_position = total_rev - total_exp
        projections.append({
            "year": year,
            "revenue": round(total_rev, 2),
            "expenses": round(total_exp, 2),
            "surplus_deficit": round(net_position, 2)
        })
        
    return projections`}</pre>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">5-Year Projection</label>
                  <div className="w-full h-[32rem] bg-zinc-950 border border-zinc-800 rounded-lg p-4 overflow-y-auto">
                    {isRunning['calculate-sustainability'] ? (
                      <div className="flex flex-col items-center gap-3 text-emerald-400 h-full justify-center">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="text-center">
                          Calculating financial projections...
                        </span>
                      </div>
                    ) : sustainabilityResult ? (
                      <div className="space-y-4">
                        {sustainabilityResult.error ? (
                          <div className="text-red-400">{sustainabilityResult.error}</div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                              <h3 className="font-bold text-emerald-400 text-lg">Viability Analysis</h3>
                              <span className={`px-2 py-1 rounded text-xs font-bold ${sustainabilityResult.is_viable ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                {sustainabilityResult.is_viable ? 'VIABLE' : 'AT RISK'}
                              </span>
                            </div>
                            
                            <div className="space-y-2">
                              {sustainabilityResult.projection?.map((yearData: any) => (
                                <div key={yearData.year} className="bg-zinc-900 p-3 rounded border border-zinc-800 flex justify-between items-center">
                                  <div className="font-bold text-zinc-300">Year {yearData.year}</div>
                                  <div className="flex gap-4 text-sm">
                                    <div className="text-emerald-400">+${yearData.revenue?.toLocaleString()}</div>
                                    <div className="text-red-400">-${yearData.expenses?.toLocaleString()}</div>
                                    <div className={`font-bold ${yearData.surplus_deficit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                      ${yearData.surplus_deficit?.toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {sustainabilityResult.summary && (
                              <div className="mt-4 bg-zinc-900/50 p-3 rounded border border-zinc-800">
                                <div className="text-zinc-500 text-xs mb-1">Executive Summary</div>
                                <div className="text-zinc-300 text-sm leading-relaxed">{sustainabilityResult.summary}</div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="text-zinc-600 h-full flex items-center justify-center text-center">
                        Run the target to generate financial projections.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : activeTarget === 'match-stakeholders' ? (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider">Region / Postcode</label>
                    <input
                      type="text"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-300 focus:outline-none focus:border-emerald-500 transition-colors font-mono text-sm uppercase"
                    />
                  </div>
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-xs text-zinc-400 font-mono overflow-y-auto h-64">
                    <div className="text-emerald-500 mb-2">Stakeholder Intelligence:</div>
                    <pre>{`import argparse
from intelligence import scan_council_minutes, scan_linkedin

def match_stakeholders(region: str, focus: str):
    # Scans Council minutes and LinkedIn activity
    # to identify high-affinity entry points.
    
    council_data = scan_council_minutes(region, focus)
    linkedin_data = scan_linkedin(region, focus)
    
    # AI filters and categorizes the results
    return ai.extract_stakeholders(council_data, linkedin_data)`}</pre>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Identified Stakeholders</label>
                  <div className="w-full h-96 bg-zinc-950 border border-zinc-800 rounded-lg p-4 overflow-y-auto">
                    {isRunning['match-stakeholders'] ? (
                      <div className="flex flex-col items-center gap-3 text-emerald-400 h-full justify-center">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="text-center">
                          Searching for stakeholders in {region}...
                        </span>
                      </div>
                    ) : stakeholdersResult ? (
                      <div className="space-y-4">
                        {stakeholdersResult.map((stakeholder, i) => (
                          <div key={i} className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold text-emerald-400 text-lg">{stakeholder.name}</h3>
                              <span className="bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded">{stakeholder.type}</span>
                            </div>
                            <p className="text-sm text-zinc-300">{stakeholder.reason}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-zinc-600 h-full flex items-center justify-center text-center">
                        Run the target to identify local stakeholders.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : activeTarget === 'analyze-demographics' ? (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider">UK Postcode</label>
                    <input
                      type="text"
                      value={postcode}
                      onChange={(e) => setPostcode(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-300 focus:outline-none focus:border-emerald-500 transition-colors font-mono text-sm uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider">Stats Needed</label>
                    <div className="flex flex-wrap gap-2">
                      {['imd_decile', 'lone_parent_households', 'local_authority', 'eligible_for_levelling_up_fund'].map(stat => (
                        <label key={stat} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded cursor-pointer hover:bg-zinc-800 transition-colors">
                          <input 
                            type="checkbox" 
                            checked={statsNeeded.includes(stat)}
                            onChange={(e) => {
                              if (e.target.checked) setStatsNeeded([...statsNeeded, stat]);
                              else setStatsNeeded(statsNeeded.filter(s => s !== stat));
                            }}
                            className="accent-emerald-500"
                          />
                          <span className="text-sm text-zinc-300 capitalize">{stat.replace(/_/g, ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-xs text-zinc-400 font-mono overflow-y-auto h-64">
                    <div className="text-emerald-500 mb-2">ONS API Implementation:</div>
                    <pre>{`def get_uk_stats(postcode: str):
    # 2026 ONS API - pulling 2021 Census + 2025 Mid-Year Estimates
    # Focus on: IMD Decile, Health Deprivation, and Local Income
    api_url = f"https://indices.communities.gov.uk/api/postcode/{postcode}"
    
    # Critical for UK Funders:
    # They want to see if the center is in the "Bottom 10% or 20% most deprived areas"
    return {
        "imd_decile": 2, # 1 is most deprived, 10 is least
        "lone_parent_households": "18%",
        "local_authority": "Hackney",
        "eligible_for_levelling_up_fund": True
    }`}</pre>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Demographic Results</label>
                  <div className="w-full h-96 bg-zinc-950 border border-zinc-800 rounded-lg p-4 overflow-y-auto">
                    {isRunning['analyze-demographics'] ? (
                      <div className="flex flex-col items-center gap-3 text-emerald-400 h-full justify-center">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="text-center">
                          Querying ONS Data for {postcode}...
                        </span>
                      </div>
                    ) : demographicsResult ? (
                      <div className="space-y-4">
                        {demographicsResult.error ? (
                          <div className="text-red-400">{demographicsResult.error}</div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                              <h3 className="font-bold text-emerald-400 text-lg">{demographicsResult.local_authority || `Postcode: ${postcode}`}</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              {statsNeeded.includes('imd_decile') && (
                                <div className="bg-zinc-900 p-3 rounded border border-zinc-800">
                                  <div className="text-zinc-500 text-xs mb-1">IMD Decile</div>
                                  <div className="text-zinc-200 font-medium">{demographicsResult.imd_decile || 'N/A'}</div>
                                </div>
                              )}
                              {statsNeeded.includes('lone_parent_households') && (
                                <div className="bg-zinc-900 p-3 rounded border border-zinc-800">
                                  <div className="text-zinc-500 text-xs mb-1">Lone Parent Households</div>
                                  <div className="text-zinc-200 font-medium">{demographicsResult.lone_parent_households || 'N/A'}</div>
                                </div>
                              )}
                              {statsNeeded.includes('local_authority') && (
                                <div className="bg-zinc-900 p-3 rounded border border-zinc-800">
                                  <div className="text-zinc-500 text-xs mb-1">Local Authority</div>
                                  <div className="text-zinc-200 font-medium">{demographicsResult.local_authority || 'N/A'}</div>
                                </div>
                              )}
                              {statsNeeded.includes('eligible_for_levelling_up_fund') && (
                                <div className="bg-zinc-900 p-3 rounded border border-zinc-800">
                                  <div className="text-zinc-500 text-xs mb-1">Levelling Up Fund</div>
                                  <div className="text-zinc-200 font-medium">{demographicsResult.eligible_for_levelling_up_fund ? 'Eligible' : 'Not Eligible'}</div>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="text-zinc-600 h-full flex items-center justify-center text-center">
                        Run the target to fetch neighborhood statistics.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : activeTarget === 'search-grants' ? (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider">Search Query</label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-300 focus:outline-none focus:border-emerald-500 transition-colors font-mono text-sm"
                    />
                  </div>
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-xs text-zinc-400 font-mono overflow-y-auto h-64">
                    <div className="text-emerald-500 mb-2">Firecrawl Scraper Implementation:</div>
                    <pre>{`import os
from firecrawl import FirecrawlApp
from pydantic import BaseModel

class GrantOpportunity(BaseModel):
    name: str
    funding_amount: str
    deadline: str
    eligibility_criteria: str
    application_url: str

def grant_scraper_tool(query: str):
    app = FirecrawlApp(api_key=os.getenv("FIRECRAWL_API_KEY"))
    search_result = app.search(query, limit=5)
    
    extracted_data = []
    for result in search_result['data']:
        data = app.scrape_url(
            result['url'], 
            params={'extract': True, 'schema': GrantOpportunity.model_json_schema()}
        )
        extracted_data.append(data['extracted_data'])
    
    return extracted_data`}</pre>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Extracted Grants</label>
                  <div className="w-full h-96 bg-zinc-950 border border-zinc-800 rounded-lg p-4 overflow-y-auto">
                    {isRunning['search-grants'] ? (
                      <div className="flex flex-col items-center gap-3 text-emerald-400 h-full justify-center">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="text-center">
                          Searching web & extracting grant data...
                        </span>
                      </div>
                    ) : searchResults ? (
                      <div className="space-y-4">
                        {searchResults.map((grant: any, idx: number) => (
                          <div key={idx} className="p-4 border border-zinc-800 rounded-lg bg-zinc-900/50 space-y-2">
                            <h3 className="font-bold text-emerald-400 text-base">{grant.name}</h3>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                                <span className="text-zinc-500 block mb-1">Funding Amount</span>
                                <span className="text-zinc-300 font-medium">{grant.funding_amount}</span>
                              </div>
                              <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                                <span className="text-zinc-500 block mb-1">Deadline</span>
                                <span className="text-zinc-300 font-medium">{grant.deadline}</span>
                              </div>
                            </div>
                            <div className="bg-zinc-950 p-2 rounded border border-zinc-800 text-xs">
                              <span className="text-zinc-500 block mb-1">Eligibility</span>
                              <span className="text-zinc-300">{grant.eligibility_criteria}</span>
                            </div>
                            <div className="text-xs pt-2 border-t border-zinc-800/50 truncate">
                              <span className="text-zinc-500 mr-2">URL:</span>
                              <a href={grant.application_url} target="_blank" rel="noreferrer" className="text-emerald-500 hover:underline">
                                {grant.application_url}
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-zinc-600 h-full flex items-center justify-center text-center">
                        Run the target to search for grants.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : activeTarget === 'eval' ? (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Evaluation Dataset (JSON)</label>
                  <textarea 
                    value={datasetJson}
                    onChange={(e) => setDatasetJson(e.target.value)}
                    className="w-full h-96 bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-zinc-300 focus:outline-none focus:border-emerald-500 transition-colors resize-none font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">LLM-as-a-Judge Result</label>
                  <div className="w-full h-96 bg-zinc-950 border border-zinc-800 rounded-lg p-4 overflow-y-auto">
                    {isRunning.eval ? (
                      <div className="flex flex-col items-center gap-3 text-purple-400 h-full justify-center">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="text-center">
                          1. Generating agent response (gemini-3-flash-preview)<br/>
                          2. Grading output (gemini-3.1-pro-preview)...
                        </span>
                      </div>
                    ) : evalResult ? (
                      <div className="space-y-4">
                        {evalResult.map((res: any, idx: number) => (
                          <div key={idx} className="p-4 border border-zinc-800 rounded-lg bg-zinc-900/50 space-y-3">
                            <div className="flex justify-between items-start">
                               <h3 className="font-bold text-emerald-400 text-base">{res.id}</h3>
                               <span className={`px-2 py-1 rounded text-xs font-bold ${res.passed ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
                                 {res.passed ? '✅ PASS' : '❌ FAIL'} ({res.score})
                               </span>
                            </div>
                            
                            {res.reasoning && (
                              <div className="text-zinc-300 text-sm">
                                <strong>Reasoning:</strong> {res.reasoning}
                              </div>
                            )}
                            
                            <div className="flex gap-2 text-xs">
                              <span className={`px-2 py-1 rounded ${res.hallucination_detected ? 'bg-red-900/30 text-red-400' : 'bg-emerald-900/30 text-emerald-400'}`}>
                                Hallucination: {res.hallucination_detected ? 'Yes' : 'No'}
                              </span>
                              <span className={`px-2 py-1 rounded ${res.is_persuasive ? 'bg-emerald-900/30 text-emerald-400' : 'bg-amber-900/30 text-amber-400'}`}>
                                Persuasive: {res.is_persuasive ? 'Yes' : 'No'}
                              </span>
                            </div>
                            
                            <div className="pt-2 border-t border-zinc-800/50">
                              <div className="text-xs text-zinc-500 mb-1">Agent Output:</div>
                              <div className="text-zinc-400 text-xs italic border-l-2 border-zinc-700 pl-2">
                                {res.agentOutput}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-zinc-600 h-full flex items-center justify-center text-center">
                        Run the target to evaluate the agent's output against the dataset.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 uppercase tracking-wider">Terminal Output</label>
                <div className="bg-[#0c0c0c] border border-zinc-800 rounded-lg p-4 font-mono text-xs text-zinc-300 h-96 overflow-y-auto shadow-inner">
                  {logs[activeTarget]?.map((line, i) => {
                    const isSuccess = line.startsWith('✔') || line.startsWith('PASS') || line.startsWith('Successfully');
                    const isCommand = line.startsWith('>');
                    return (
                      <div key={i} className={`py-0.5 ${isSuccess ? 'text-emerald-400' : isCommand ? 'text-zinc-500' : ''}`}>
                        {line}
                      </div>
                    );
                  })}
                  {isRunning[activeTarget] && (
                    <div className="flex items-center gap-2 mt-2 text-zinc-500">
                      <Loader2 className="w-3 h-3 animate-spin" /> Executing...
                    </div>
                  )}
                  <div ref={terminalEndRef} />
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

function TargetButton({ active, onClick, icon, label, executor }: any) {
  return (
    <button
      onClick={onClick}
      className={`group w-full text-left p-3 rounded flex flex-col gap-1 transition-all cursor-pointer active:scale-[0.98] ${
        active ? 'bg-emerald-900/20 hover:bg-emerald-900/40 border border-emerald-500/30' : 'hover:bg-emerald-900/10 border border-transparent'
      }`}
    >
      <div className={`flex items-center gap-2 transition-colors ${active ? 'text-emerald-400' : 'text-emerald-500/70 group-hover:text-emerald-400'}`}>
        {icon}
        <span className="font-medium">{label}</span>
      </div>
      <div className={`text-[10px] font-mono ml-6 transition-colors ${active ? 'text-emerald-500/70' : 'text-emerald-500/40 group-hover:text-emerald-500/60'}`}>
        {executor}
      </div>
    </button>
  );
}
