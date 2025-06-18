import { WorkflowStep } from "./workflow-engine";

/**
 * ULTRA-ENHANCED Article Workflow - Maximum Quality Edition (13 Steps)
 * Optimized for when speed/cost aren't concerns - focuses on absolute quality
 */
export const enhancedArticleWorkflow: WorkflowStep[] = [
  {
    id: "initial-content-analysis",
    model: "gemini", // Start with Gemini's massive context for large inputs
    title: "Deep Content Understanding",
    description: "Comprehensive analysis of user input using 1M context window",
    capabilities: [
      "high-context-analysis",
      "document-analysis",
      "comprehensive-review",
    ],
    prioritizeBy: "context",
    timeEstimate: 4,
    rawPrompt: `You are a comprehensive content analysis expert with massive context capacity. Your role is to deeply understand and structure the user's request, even if it contains extensive information, documents, or complex requirements.

USER INPUT: {{userInput}}

DEEP ANALYSIS TASKS:
1. Extract all explicit requirements and objectives
2. Identify implicit needs and unstated assumptions
3. Detect any embedded documents, data, or reference materials
4. Understand the intended audience and context
5. Identify potential complexity factors or challenges
6. Map out content relationships and dependencies

COMPREHENSIVE OUTPUT:
- CORE_OBJECTIVES: [Primary goals and deliverables]
- AUDIENCE_PROFILE: [Target readers and their needs]
- CONTENT_SCOPE: [What should be included/excluded]
- COMPLEXITY_FACTORS: [Technical, research, or structural challenges]
- EMBEDDED_CONTENT: [Any data, documents, or references provided]
- SUCCESS_METRICS: [How to measure quality and completeness]
- STRATEGIC_APPROACH: [Recommended methodology based on analysis]
- POTENTIAL_CHALLENGES: [Foreseeable issues and mitigation strategies]

Use your massive context capacity to ensure no nuance or detail is overlooked.`,
  },

  {
    id: "clarify-brief",
    model: "gpt",
    title: "Strategic Task Clarification",
    description: "Transform analysis into actionable project brief",
    capabilities: ["creative-polish", "json-output", "structural-analysis"],
    prioritizeBy: "accuracy",
    timeEstimate: 3,
    rawPrompt: `You are an expert project strategist. Based on the comprehensive content analysis, create a crystal-clear project brief with specific objectives and success criteria.

CONTENT ANALYSIS: {{step1}}
ORIGINAL REQUEST: {{userInput}}

Transform this into a strategic brief:
REFINED_OBJECTIVE: [Clear, measurable main goal]
PROJECT_SCOPE: [Detailed boundaries and deliverables]
SUCCESS_CRITERIA: [Specific quality benchmarks]
STRATEGIC_APPROACH: [Recommended methodology]
QUALITY_STANDARDS: [Standards for excellence]
RISK_MITIGATION: [Potential issues and solutions]
STAKEHOLDER_VALUE: [Value proposition for each audience]`,
  },

  {
    id: "comprehensive-research",
    model: "grok",
    title: "Deep Research & Real-Time Data",
    description: "Extensive real-time research with current data and trends",
    capabilities: [
      "live-web",
      "real-time-data",
      "fact-checking",
      "high-volume-research",
    ],
    prioritizeBy: "accuracy",
    requiresValidation: true,
    validationType: "source_verify",
    timeEstimate: 10,
    rawPrompt: `You are a master research specialist with real-time web access. Conduct comprehensive research based on the strategic brief.

STRATEGIC BRIEF: {{step2}}
ORIGINAL ANALYSIS: {{step1}}

RESEARCH REQUIREMENTS:
1. Current data and statistics (prioritize last 3 months)
2. Expert opinions and authoritative sources
3. Industry trends and emerging developments
4. Contradictory viewpoints and debates
5. Case studies and real-world examples
6. Technical specifications and standards (if applicable)

DELIVER:
- CURRENT_STATISTICS: [Latest data with dates and sources]
- EXPERT_INSIGHTS: [Quotes and perspectives from authorities]
- TREND_ANALYSIS: [Emerging patterns and developments]
- CONTRADICTORY_EVIDENCE: [Alternative viewpoints and debates]
- CASE_STUDIES: [Real examples and applications]
- SOURCE_RELIABILITY: [Assessment of source quality]
- RESEARCH_GAPS: [Areas needing additional investigation]`,
  },

  {
    id: "source-validation-checkpoint",
    model: "gemini",
    title: "Comprehensive Source Validation",
    description: "Deep validation of research sources and fact verification",
    capabilities: ["document-analysis", "fact-checking", "source-verification"],
    prioritizeBy: "accuracy",
    requiresValidation: true,
    validationType: "source_verify",
    timeEstimate: 6,
    rawPrompt: `You are a fact-checking and source validation expert. Thoroughly validate all research findings and sources from the comprehensive research phase.

RESEARCH FINDINGS: {{step3}}
PROJECT BRIEF: {{step2}}

VALIDATION CHECKLIST:
1. Verify source authenticity and credibility
2. Cross-reference claims across multiple sources
3. Check recency and relevance of data
4. Identify potential bias or conflicts of interest
5. Validate statistical claims and methodologies
6. Flag any questionable or unverifiable information

VALIDATION REPORT:
- VERIFIED_SOURCES: [Confirmed reliable sources with ratings]
- QUESTIONABLE_CLAIMS: [Items requiring additional verification]
- CONFLICTING_INFORMATION: [Contradictions found in sources]
- BIAS_ASSESSMENT: [Potential source bias identified]
- CONFIDENCE_SCORES: [Reliability ratings for each major claim]
- RECOMMENDED_ADDITIONS: [Additional sources or verification needed]`,
  },

  {
    id: "logical-structure-design",
    model: "claude",
    title: "Advanced Logical Architecture",
    description:
      "Create sophisticated logical framework and reasoning structure",
    capabilities: [
      "structural-analysis",
      "logical-reasoning",
      "long-form-narrative",
    ],
    prioritizeBy: "accuracy",
    timeEstimate: 7,
    rawPrompt: `You are a master logical architect. Create a sophisticated structural framework based on validated research and clear project objectives.

VALIDATED RESEARCH: {{step3}}
SOURCE VALIDATION: {{step4}}
PROJECT BRIEF: {{step2}}

STRUCTURAL DESIGN:
1. Create logical hierarchy and flow
2. Design argument progression and evidence integration
3. Identify optimal narrative structure
4. Plan transition strategies between sections
5. Design engagement and retention elements
6. Map out supporting evidence placement

DELIVERABLES:
- LOGICAL_HIERARCHY: [Main points, sub-points, supporting details]
- NARRATIVE_FLOW: [Story progression and reader journey]
- EVIDENCE_MAPPING: [Where each piece of research fits]
- TRANSITION_STRATEGY: [How sections connect and flow]
- ENGAGEMENT_HOOKS: [Elements to maintain reader interest]
- QUALITY_CHECKPOINTS: [Key validation points throughout]`,
  },

  {
    id: "enhanced-content-creation",
    model: "gpt",
    title: "Premium Content Generation",
    description: "Create sophisticated first draft with advanced storytelling",
    capabilities: [
      "creative-polish",
      "long-form-narrative",
      "human-like-voice",
    ],
    prioritizeBy: "accuracy",
    timeEstimate: 12,
    rawPrompt: `You are a master content creator and storyteller. Create a sophisticated, engaging draft that brings together all research, structure, and strategic objectives.

PROJECT BRIEF: {{step2}}
VALIDATED RESEARCH: {{step3}}
LOGICAL STRUCTURE: {{step5}}

CONTENT REQUIREMENTS:
- Compelling opening that immediately engages the target audience
- Seamless integration of verified research and evidence
- Natural, conversational tone with authority and expertise
- Strategic use of examples, analogies, and case studies
- Smooth transitions that guide readers through the logical flow
- Engaging conclusion with clear value proposition and next steps

QUALITY STANDARDS:
- Every claim must be supported by validated research
- Logical progression should be clear and compelling
- Voice should be confident, authoritative, yet accessible
- Content should deliver clear value to the specified audience
- Structure should support easy reading and comprehension`,
  },

  {
    id: "mid-workflow-validation",
    model: "claude",
    title: "Mid-Workflow Logic & Fact Audit",
    description: "Comprehensive logic check and fact validation at midpoint",
    capabilities: ["logic-audit", "fact-checking", "structural-analysis"],
    prioritizeBy: "accuracy",
    requiresValidation: true,
    validationType: "fact_check",
    timeEstimate: 8,
    rawPrompt: `You are a rigorous quality auditor conducting a comprehensive mid-workflow review. Analyze the draft for logical consistency, factual accuracy, and structural integrity.

CONTENT DRAFT: {{step6}}
ORIGINAL RESEARCH: {{step3}}
VALIDATION REPORT: {{step4}}

AUDIT CHECKLIST:
1. Logical consistency throughout the narrative
2. Factual accuracy against validated sources
3. Structural integrity and flow
4. Evidence integration and citation accuracy
5. Argument strength and coherence
6. Potential gaps or weaknesses

AUDIT REPORT:
- LOGIC_ASSESSMENT: [Reasoning quality and consistency]
- FACT_VERIFICATION: [Accuracy against source material]
- STRUCTURAL_ANALYSIS: [Flow, transitions, and organization]
- EVIDENCE_INTEGRATION: [Quality of research incorporation]
- IDENTIFIED_ISSUES: [Specific problems and recommendations]
- QUALITY_SCORE: [Overall assessment 1-10]
- IMPROVEMENT_PRIORITIES: [Most critical areas for enhancement]`,
  },

  {
    id: "real-time-update-injection",
    model: "grok",
    title: "Fresh Data Integration",
    description: "Inject latest real-time developments and current information",
    capabilities: ["live-web", "real-time-data", "fact-checking"],
    prioritizeBy: "accuracy",
    timeEstimate: 5,
    rawPrompt: `You are a real-time information specialist. Search for and integrate the very latest developments, data, or news related to the content topic.

CURRENT DRAFT: {{step6}}
AUDIT FINDINGS: {{step7}}
ORIGINAL BRIEF: {{step2}}

REAL-TIME INTEGRATION:
1. Search for developments from the last 24-48 hours
2. Find updated statistics or revised data
3. Identify breaking news or recent announcements
4. Look for new expert commentary or analysis
5. Check for regulatory or policy changes

INTEGRATION DELIVERABLE:
- LATEST_DEVELOPMENTS: [Recent news, updates, changes]
- UPDATED_STATISTICS: [Any newer data found]
- EXPERT_UPDATES: [Recent commentary or analysis]
- INTEGRATION_RECOMMENDATIONS: [How to incorporate new information]
- RELEVANCE_ASSESSMENT: [Impact on current content]`,
  },

  {
    id: "advanced-enhancement",
    model: "gpt",
    title: "Advanced Creative Enhancement",
    description: "Sophisticated polish with engagement optimization",
    capabilities: [
      "creative-polish",
      "human-like-voice",
      "structural-analysis",
    ],
    prioritizeBy: "accuracy",
    timeEstimate: 9,
    rawPrompt: `You are a master content enhancer specializing in engagement and readability. Polish the content to maximum engagement while maintaining accuracy and integrating fresh updates.

AUDITED DRAFT: {{step6}}
AUDIT REPORT: {{step7}}
FRESH UPDATES: {{step8}}

ENHANCEMENT OBJECTIVES:
- Maximize reader engagement and retention
- Integrate fresh updates seamlessly
- Enhance readability and flow
- Add compelling examples and analogies
- Strengthen emotional connection
- Optimize for target audience

ENHANCEMENT AREAS:
- Engaging hooks and transitions
- Vivid examples and case studies
- Emotional resonance and human connection
- Clear, accessible language
- Strategic emphasis and highlighting
- Compelling calls-to-action or conclusions

Deliver content that is both highly accurate and irresistibly engaging.`,
  },

  {
    id: "cross-model-validation",
    model: "claude",
    title: "Advanced Cross-Model Validation",
    description: "Sophisticated validation using multiple model perspectives",
    capabilities: ["logic-audit", "fact-checking", "structural-analysis"],
    prioritizeBy: "accuracy",
    requiresValidation: true,
    validationType: "logic_audit",
    timeEstimate: 7,
    rawPrompt: `You are a senior quality assurance expert conducting advanced cross-model validation. Provide the most rigorous assessment of the enhanced content.

ENHANCED CONTENT: {{step9}}
FRESH UPDATES: {{step8}}
PREVIOUS AUDIT: {{step7}}

VALIDATION FRAMEWORK:
1. Logical reasoning and argument structure
2. Factual accuracy and evidence support
3. Source integration and citation quality
4. Narrative flow and reader experience
5. Target audience alignment
6. Overall value proposition delivery

COMPREHENSIVE ASSESSMENT:
- LOGIC_INTEGRITY: [Reasoning quality throughout]
- FACTUAL_ACCURACY: [Evidence-based claim verification]
- STRUCTURAL_QUALITY: [Organization and flow assessment]
- ENGAGEMENT_EFFECTIVENESS: [Reader experience evaluation]
- AUDIENCE_ALIGNMENT: [Target audience fit]
- FINAL_CONFIDENCE: [Overall quality confidence score]
- CRITICAL_ISSUES: [Any remaining concerns]
- PUBLICATION_READINESS: [Go/no-go recommendation]`,
  },

  {
    id: "production-optimization",
    model: "gpt",
    title: "Production-Ready Optimization",
    description: "Final optimization for professional delivery",
    capabilities: ["creative-polish", "json-output", "structural-analysis"],
    prioritizeBy: "accuracy",
    timeEstimate: 6,
    rawPrompt: `You are a publication specialist optimizing content for professional delivery. Create the definitive production version.

VALIDATED CONTENT: {{step9}}
VALIDATION REPORT: {{step10}}

PRODUCTION OPTIMIZATION:
- Professional formatting and structure
- Optimal headline and subheading hierarchy
- Strategic emphasis and highlighting
- Professional citation format
- Executive summary and key takeaways
- Clear value proposition and conclusions
- Final polish for maximum impact

DELIVERABLES:
- Publication-ready content with professional formatting
- Executive summary for quick consumption
- Key takeaways section for easy reference
- Proper citation and reference formatting
- Optimized structure for target medium/platform`,
  },

  {
    id: "quality-assurance-final",
    model: "claude",
    title: "Ultimate Quality Assurance",
    description: "Final comprehensive quality check before publication",
    capabilities: [
      "logic-audit",
      "structural-analysis",
      "comprehensive-review",
    ],
    prioritizeBy: "accuracy",
    timeEstimate: 5,
    rawPrompt: `You are the final quality gatekeeper. Conduct the ultimate quality assurance review before publication clearance.

PRODUCTION VERSION: {{step11}}
VALIDATION HISTORY: {{step10}}

FINAL QA CHECKLIST:
- Content accuracy and fact verification
- Logical consistency and flow
- Professional presentation quality
- Target audience appropriateness
- Value delivery assessment
- Publication standards compliance

FINAL CLEARANCE:
- QUALITY_ASSESSMENT: [Comprehensive quality evaluation]
- STANDARDS_COMPLIANCE: [Professional publication standards]
- AUDIENCE_FIT: [Target audience alignment verification]
- VALUE_DELIVERY: [Objective achievement confirmation]
- PUBLICATION_CLEARANCE: [APPROVED/NEEDS_REVISION with specifics]
- FINAL_RECOMMENDATIONS: [Any last-minute suggestions]`,
  },

  {
    id: "comprehensive-proofreading-analysis",
    model: "gemini",
    title: "Ultimate Proofreading & Context Analysis",
    description:
      "Comprehensive proofreading and strategic analysis using complete workflow history",
    capabilities: [
      "high-context-analysis",
      "comprehensive-review",
      "document-analysis",
    ],
    prioritizeBy: "context",
    timeEstimate: 10,
    rawPrompt: `You are the ultimate proofreading specialist with access to the entire workflow journey. Your mission is to provide comprehensive feedback for the final optimization.

ORIGINAL USER REQUEST: {{userInput}}

COMPLETE WORKFLOW HISTORY:
Step 1 - Initial Analysis: {{step1}}
Step 2 - Strategic Brief: {{step2}}
Step 3 - Comprehensive Research: {{step3}}
Step 4 - Source Validation: {{step4}}
Step 5 - Logical Structure: {{step5}}
Step 6 - Content Creation: {{step6}}
Step 7 - Mid-Workflow Audit: {{step7}}
Step 8 - Real-Time Updates: {{step8}}
Step 9 - Advanced Enhancement: {{step9}}
Step 10 - Cross-Validation: {{step10}}
Step 11 - Production Version: {{step11}}
Step 12 - Final QA: {{step12}}

COMPREHENSIVE PROOFREADING ANALYSIS:
1. Cross-reference current content against ALL collected insights
2. Identify any valuable research that was compressed out
3. Verify all strategic objectives were fully achieved
4. Check for content gaps, inconsistencies, or missed opportunities
5. Assess readability, flow, and engagement quality
6. Validate accuracy and source integration
7. Evaluate completeness against original request

DETAILED FEEDBACK FOR FINAL OPTIMIZATION:
- CONTENT_GAPS: [Missing elements that should be included]
- ENHANCEMENT_OPPORTUNITIES: [Specific improvements for impact/quality]
- STRUCTURAL_RECOMMENDATIONS: [Flow, organization, presentation improvements]
- FACTUAL_VERIFICATION: [Any claims needing verification or adjustment]
- SOURCE_INTEGRATION: [How to better utilize research findings]
- ENGAGEMENT_OPTIMIZATION: [Ways to improve readability and impact]
- COMPLETENESS_ASSESSMENT: [How well current version fulfills original request]
- FINAL_POLISH_PRIORITIES: [Top 3-5 changes for maximum improvement]

Provide specific, actionable feedback that will enable the final step to produce the ultimate version.`,
  },

  {
    id: "ultimate-final-article",
    model: "claude",
    title: "Ultimate Final Article Production",
    description:
      "Create the definitive final article incorporating all feedback and research",
    capabilities: [
      "long-form-narrative",
      "logical-reasoning",
      "structural-analysis",
      "comprehensive-review",
    ],
    prioritizeBy: "accuracy",
    timeEstimate: 12,
    rawPrompt: `You are the master content creator producing the ultimate final version. Your ONLY task is to deliver the complete, comprehensive, full-length final article with all sources and citations integrated.

ORIGINAL USER REQUEST: {{userInput}}

PRODUCTION VERSION: {{step11}}
GEMINI PROOFREADING ANALYSIS: {{step13}}

CRITICAL INSTRUCTIONS:
- DELIVER the COMPLETE, FULL-LENGTH final article from start to finish
- DO NOT provide analysis, commentary, or meta-discussion about the process
- DO NOT explain what you're doing or provide process descriptions
- DO NOT provide just a summary or conclusion - write the ENTIRE article
- Begin immediately with the article content and include every section
- Include ALL verified sources and citations in proper format throughout
- Integrate all valuable research and insights from the workflow
- Address every improvement suggested by the analysis
- Ensure the article completely fulfills the original user request

MANDATORY COMPLETE ARTICLE STRUCTURE:
You MUST include ALL of these components in your response:

1. **COMPELLING TITLE** - Professional, engaging title for the article

2. **INTRODUCTION SECTION** (3-5 paragraphs minimum)
   - Hook that grabs attention
   - Context and background
   - Clear statement of the article's purpose
   - Preview of what readers will learn

3. **MAIN BODY CONTENT** (MULTIPLE comprehensive sections)
   - All key points from the research fully developed
   - Each major topic gets its own substantial section
   - Evidence and examples throughout
   - Smooth transitions between sections
   - In-depth coverage of all aspects of the topic

4. **SUPPORTING EVIDENCE INTEGRATION**
   - Statistics and data points with citations
   - Expert quotes and opinions with sources
   - Case studies and real-world examples
   - Historical context where relevant

5. **ANALYSIS AND INSIGHTS**
   - Your expert analysis of the information
   - Implications and significance
   - Connections between different points
   - Forward-looking perspectives

6. **CONCLUSION SECTION** (2-3 paragraphs)
   - Summary of key insights
   - Final thoughts and implications
   - Call to action or next steps (if appropriate)

7. **COMPLETE REFERENCES SECTION**
   - All sources listed alphabetically
   - Complete citation information for each source

CONTENT REQUIREMENTS:
- MINIMUM 1000-2000 words for substantial topics
- Comprehensive coverage that fully addresses the original request
- ALL sources properly cited throughout using: [Source: Publication Name, Article Title, Date, URL]
- Professional tone and engaging writing style
- Logical flow from introduction through conclusion
- Every claim backed by verified sources
- Executive summary only if specifically requested in original user input

CITATION FORMAT THROUGHOUT:
- Use in-text citations: [Source: Publication Name, Article Title, Date, URL]
- Include complete references section at end
- Ensure every major claim, statistic, and insight is properly sourced

WHAT THIS MEANS:
Write the ENTIRE article - not just an outline, not just key points, not just a conclusion with sources. Include the full introduction, all main body sections with detailed content, comprehensive analysis, and proper conclusion. The user should receive a complete, ready-to-publish article that thoroughly covers their requested topic.

Begin writing the complete article immediately - start with the title and write every section in full:`,
  },
];

/**
 * ULTRA-ENHANCED Research Workflow - Maximum Quality Edition (11 Steps)
 * Optimized for comprehensive research when speed/cost aren't limiting factors
 */
export const enhancedResearchWorkflow: WorkflowStep[] = [
  {
    id: "research-input-analysis",
    model: "gemini",
    title: "Comprehensive Research Input Analysis",
    description:
      "Deep analysis of research request using massive context capacity",
    capabilities: [
      "high-context-analysis",
      "document-analysis",
      "comprehensive-review",
    ],
    prioritizeBy: "context",
    timeEstimate: 5,
    rawPrompt: `You are a comprehensive research analysis expert. Analyze the research request in detail to understand all dimensions and requirements.

RESEARCH REQUEST: {{userInput}}

COMPREHENSIVE ANALYSIS:
1. Extract explicit research objectives and questions
2. Identify implicit research needs and underlying motivations
3. Determine research scope, depth, and boundaries
4. Assess complexity factors and potential challenges
5. Identify target audience and use case for research
6. Map out research methodology requirements

DETAILED OUTPUT:
- PRIMARY_OBJECTIVES: [Core research goals and questions]
- SCOPE_DEFINITION: [What to include/exclude in research]
- METHODOLOGY_REQUIREMENTS: [Research approaches needed]
- AUDIENCE_PROFILE: [Who will use this research and how]
- COMPLEXITY_ASSESSMENT: [Technical, temporal, or domain challenges]
- SUCCESS_CRITERIA: [How to measure research completeness and quality]
- STRATEGIC_APPROACH: [Optimal research strategy based on analysis]`,
  },

  {
    id: "research-scope-design",
    model: "claude",
    title: "Strategic Research Scope & Methodology Design",
    description: "Design comprehensive research framework and methodology",
    capabilities: [
      "structural-analysis",
      "logical-reasoning",
      "creative-polish",
    ],
    prioritizeBy: "accuracy",
    timeEstimate: 6,
    rawPrompt: `You are a research methodology expert. Design a comprehensive research framework based on the input analysis.

INPUT ANALYSIS: {{step1}}
ORIGINAL REQUEST: {{userInput}}

FRAMEWORK DESIGN:
1. Define specific research questions and hypotheses
2. Create research methodology and approach
3. Design data collection strategy
4. Plan analysis and synthesis methods
5. Establish quality standards and validation criteria
6. Create timeline and milestone framework

RESEARCH FRAMEWORK:
- RESEARCH_QUESTIONS: [Specific, measurable questions to answer]
- METHODOLOGY: [Systematic approach to investigation]
- DATA_STRATEGY: [Types of data needed and collection methods]
- ANALYSIS_PLAN: [How to process and synthesize findings]
- QUALITY_STANDARDS: [Criteria for reliable and valid research]
- VALIDATION_APPROACH: [How to verify findings and conclusions]
- SUCCESS_METRICS: [Measurable outcomes for research quality]`,
  },

  {
    id: "comprehensive-data-collection",
    model: "grok",
    title: "Extensive Real-Time Data Collection",
    description: "Comprehensive data gathering with real-time sources",
    capabilities: [
      "live-web",
      "real-time-data",
      "high-volume-research",
      "fact-checking",
    ],
    prioritizeBy: "context",
    requiresValidation: true,
    validationType: "source_verify",
    timeEstimate: 15,
    rawPrompt: `You are a master research specialist with real-time web access. Conduct extensive data collection based on the research framework.

RESEARCH FRAMEWORK: {{step2}}
INPUT ANALYSIS: {{step1}}

DATA COLLECTION PRIORITIES:
1. Current market data, statistics, and trends
2. Expert opinions and authoritative sources
3. Academic research and peer-reviewed studies
4. Industry reports and competitive analysis
5. Case studies and real-world applications
6. Historical context and trend analysis
7. Regulatory and policy information
8. Emerging developments and future indicators

COMPREHENSIVE DELIVERABLE:
- QUANTITATIVE_DATA: [Statistics, metrics, financial data with sources]
- EXPERT_INSIGHTS: [Quotes, interviews, authoritative opinions]
- ACADEMIC_RESEARCH: [Peer-reviewed studies and scholarly sources]
- INDUSTRY_INTELLIGENCE: [Market reports, competitive analysis]
- CASE_STUDIES: [Real-world examples and applications]
- TREND_ANALYSIS: [Historical patterns and future projections]
- SOURCE_DOCUMENTATION: [Complete citation and reliability assessment]`,
  },

  {
    id: "source-reliability-validation",
    model: "gemini",
    title: "Advanced Source Validation & Reliability Assessment",
    description: "Comprehensive validation of all research sources and data",
    capabilities: ["document-analysis", "fact-checking", "source-verification"],
    prioritizeBy: "accuracy",
    requiresValidation: true,
    validationType: "source_verify",
    timeEstimate: 8,
    rawPrompt: `You are an expert fact-checker and source validation specialist. Thoroughly validate all research findings and assess source reliability.

RESEARCH DATA: {{step3}}
RESEARCH FRAMEWORK: {{step2}}

VALIDATION PROTOCOL:
1. Verify source authenticity and credibility
2. Cross-reference claims across multiple sources
3. Check data recency and relevance
4. Assess potential bias and conflicts of interest
5. Validate methodologies used in studies
6. Identify gaps or inconsistencies in data

VALIDATION REPORT:
- SOURCE_CREDIBILITY: [Reliability ratings for each source]
- DATA_VERIFICATION: [Cross-referenced and confirmed information]
- BIAS_ASSESSMENT: [Potential bias or limitations identified]
- METHODOLOGY_REVIEW: [Assessment of research methods used]
- CONFLICT_ANALYSIS: [Contradictory information and resolution]
- CONFIDENCE_RATINGS: [Confidence levels for each major finding]
- ADDITIONAL_VALIDATION: [Recommendations for further verification]`,
  },

  {
    id: "analytical-synthesis",
    model: "claude",
    title: "Advanced Data Analysis & Pattern Recognition",
    description:
      "Sophisticated analysis to identify patterns, insights, and implications",
    capabilities: [
      "logical-reasoning",
      "document-analysis",
      "structural-analysis",
    ],
    prioritizeBy: "accuracy",
    timeEstimate: 12,
    rawPrompt: `You are a senior research analyst specializing in pattern recognition and insight synthesis. Conduct sophisticated analysis of validated research data.

VALIDATED DATA: {{step3}}
VALIDATION REPORT: {{step4}}
RESEARCH FRAMEWORK: {{step2}}

ANALYTICAL FRAMEWORK:
1. Identify key patterns and trends across all data
2. Analyze cause-effect relationships and correlations
3. Synthesize insights from multiple data sources
4. Identify implications and strategic considerations
5. Assess risks, opportunities, and future scenarios
6. Generate evidence-based conclusions

ANALYTICAL DELIVERABLE:
- PATTERN_ANALYSIS: [Key trends and patterns identified]
- CAUSAL_RELATIONSHIPS: [Cause-effect connections discovered]
- CROSS-SOURCE_INSIGHTS: [Synthesis across different data types]
- STRATEGIC_IMPLICATIONS: [Business, market, or policy implications]
- SCENARIO_ANALYSIS: [Potential future developments]
- EVIDENCE_STRENGTH: [Confidence levels for each conclusion]
- RESEARCH_GAPS: [Areas needing additional investigation]`,
  },

  {
    id: "supplementary-research",
    model: "grok",
    title: "Targeted Supplementary Research",
    description: "Fill identified gaps with additional targeted research",
    capabilities: ["live-web", "real-time-data", "fact-checking"],
    prioritizeBy: "accuracy",
    timeEstimate: 8,
    rawPrompt: `You are conducting targeted supplementary research to fill identified gaps and strengthen the analysis.

ANALYTICAL FINDINGS: {{step5}}
IDENTIFIED GAPS: {{step5}}
ORIGINAL FRAMEWORK: {{step2}}

SUPPLEMENTARY RESEARCH TARGETS:
1. Address specific gaps identified in analysis
2. Seek additional validation for key conclusions
3. Find recent developments that impact findings
4. Locate additional expert perspectives
5. Search for contradictory evidence or alternative views
6. Strengthen evidence for critical conclusions

SUPPLEMENTARY DELIVERABLE:
- GAP_FILLING_DATA: [Information addressing identified gaps]
- ADDITIONAL_VALIDATION: [Supporting evidence for key conclusions]
- ALTERNATIVE_PERSPECTIVES: [Contradictory or alternative viewpoints]
- RECENT_DEVELOPMENTS: [Latest information affecting conclusions]
- EXPERT_VALIDATION: [Additional authoritative perspectives]
- STRENGTHENED_EVIDENCE: [Enhanced support for critical findings]`,
  },

  {
    id: "strategic-recommendations",
    model: "gpt",
    title: "Strategic Insights & Actionable Recommendations",
    description: "Generate strategic insights and practical recommendations",
    capabilities: [
      "creative-polish",
      "logical-reasoning",
      "structural-analysis",
    ],
    prioritizeBy: "accuracy",
    timeEstimate: 10,
    rawPrompt: `You are a strategic analyst creating actionable insights and recommendations based on comprehensive research.

ANALYTICAL FINDINGS: {{step5}}
SUPPLEMENTARY RESEARCH: {{step6}}
VALIDATION REPORT: {{step4}}

STRATEGIC ANALYSIS:
1. Transform research insights into actionable strategies
2. Identify immediate opportunities and recommendations
3. Assess implementation considerations and challenges
4. Develop risk mitigation strategies
5. Create success metrics and measurement approaches
6. Design implementation roadmap

STRATEGIC DELIVERABLE:
- KEY_INSIGHTS: [Most important strategic insights derived]
- ACTIONABLE_RECOMMENDATIONS: [Specific, implementable actions]
- OPPORTUNITY_ASSESSMENT: [Prioritized opportunities identified]
- IMPLEMENTATION_ROADMAP: [Step-by-step implementation guidance]
- RISK_MITIGATION: [Potential risks and mitigation strategies]
- SUCCESS_METRICS: [How to measure implementation success]
- COMPETITIVE_ADVANTAGES: [How insights create strategic value]`,
  },

  {
    id: "comprehensive-synthesis",
    model: "claude",
    title: "Comprehensive Research Synthesis",
    description: "Create comprehensive synthesis of all research and analysis",
    capabilities: [
      "structural-analysis",
      "long-form-narrative",
      "logical-reasoning",
    ],
    prioritizeBy: "accuracy",
    timeEstimate: 10,
    rawPrompt: `You are creating a comprehensive synthesis that brings together all research, analysis, and strategic insights into a cohesive whole.

STRATEGIC RECOMMENDATIONS: {{step7}}
ANALYTICAL FINDINGS: {{step5}}
SUPPLEMENTARY RESEARCH: {{step6}}
ORIGINAL FRAMEWORK: {{step2}}

SYNTHESIS REQUIREMENTS:
1. Create comprehensive narrative connecting all findings
2. Integrate quantitative and qualitative insights
3. Build logical progression from data to conclusions
4. Synthesize multiple perspectives and sources
5. Create coherent story that serves the research objectives
6. Ensure actionability and practical value

COMPREHENSIVE SYNTHESIS:
- EXECUTIVE_OVERVIEW: [High-level summary of all findings]
- INTEGRATED_NARRATIVE: [Cohesive story connecting all research]
- EVIDENCE_INTEGRATION: [How all data supports conclusions]
- MULTI-PERSPECTIVE_SYNTHESIS: [Integration of diverse viewpoints]
- ACTIONABLE_FRAMEWORK: [How insights translate to action]
- CONFIDENCE_ASSESSMENT: [Overall confidence in findings]`,
  },

  {
    id: "executive-summary-creation",
    model: "gpt",
    title: "Executive Summary & Final Report Creation",
    description: "Create polished executive summary and final research report",
    capabilities: ["creative-polish", "structural-analysis", "json-output"],
    prioritizeBy: "accuracy",
    requiresValidation: true,
    validationType: "logic_audit",
    timeEstimate: 8,
    rawPrompt: `You are creating the definitive executive summary and final research report that delivers maximum value to stakeholders.

COMPREHENSIVE SYNTHESIS: {{step8}}
STRATEGIC RECOMMENDATIONS: {{step7}}
RESEARCH FRAMEWORK: {{step2}}

FINAL REPORT STRUCTURE:
1. Executive Summary (2-3 paragraphs)
2. Key Findings Overview
3. Strategic Recommendations
4. Implementation Guidance
5. Supporting Data Summary
6. Methodology and Sources
7. Appendices with detailed findings

EXECUTIVE DELIVERABLE:
- EXECUTIVE_SUMMARY: [Compelling 2-3 paragraph overview]
- KEY_FINDINGS: [Most important discoveries and insights]
- STRATEGIC_RECOMMENDATIONS: [Priority actions and opportunities]
- IMPLEMENTATION_GUIDE: [Practical next steps and roadmap]
- CONFIDENCE_LEVELS: [Reliability assessment for each conclusion]
- SUPPORTING_EVIDENCE: [Summary of data supporting conclusions]
- METHODOLOGY_SUMMARY: [Research approach and validation process]

Format for executive consumption with clear structure and professional presentation.`,
  },

  {
    id: "quality-validation-final",
    model: "claude",
    title: "Final Research Quality Validation",
    description:
      "Comprehensive final validation of research quality and completeness",
    capabilities: ["logic-audit", "fact-checking", "structural-analysis"],
    prioritizeBy: "accuracy",
    requiresValidation: true,
    validationType: "logic_audit",
    timeEstimate: 6,
    rawPrompt: `You are conducting the final quality validation of the complete research project. Ensure highest standards of research integrity and value delivery.

FINAL REPORT: {{step9}}
COMPREHENSIVE SYNTHESIS: {{step8}}
ORIGINAL FRAMEWORK: {{step2}}

VALIDATION FRAMEWORK:
1. Research objective achievement assessment
2. Methodology rigor and appropriateness
3. Evidence quality and source reliability
4. Logical consistency of conclusions
5. Actionability of recommendations
6. Overall value and utility assessment

FINAL VALIDATION:
- OBJECTIVE_ACHIEVEMENT: [How well research objectives were met]
- METHODOLOGY_RIGOR: [Quality of research approach used]
- EVIDENCE_QUALITY: [Strength and reliability of supporting data]
- LOGICAL_INTEGRITY: [Consistency of reasoning and conclusions]
- ACTIONABILITY_ASSESSMENT: [Practical value of recommendations]
- RESEARCH_COMPLETENESS: [Comprehensiveness of investigation]
- FINAL_QUALITY_RATING: [Overall research quality assessment]
- PUBLICATION_READINESS: [Ready for delivery - Yes/No with details]`,
  },

  {
    id: "ultimate-research-report-production",
    model: "claude",
    title: "Ultimate Complete Research Report Production",
    description:
      "Produce the definitive final research report with all findings, sources, and citations",
    capabilities: [
      "long-form-narrative",
      "structural-analysis",
      "comprehensive-review",
      "logical-reasoning",
    ],
    prioritizeBy: "accuracy",
    timeEstimate: 15,
    rawPrompt: `You are the master research report writer producing the ultimate final research document. Your ONLY task is to deliver the complete, comprehensive, full-length final research report with all findings, sources, and citations.

ORIGINAL RESEARCH REQUEST: {{userInput}}

COMPLETE RESEARCH JOURNEY:
Step 1 - Input Analysis: {{step1}}
Step 2 - Research Framework: {{step2}}
Step 3 - Data Collection: {{step3}}
Step 4 - Source Validation: {{step4}}
Step 5 - Analysis & Patterns: {{step5}}
Step 6 - Supplementary Research: {{step6}}
Step 7 - Strategic Recommendations: {{step7}}
Step 8 - Comprehensive Synthesis: {{step8}}
Step 9 - Executive Summary: {{step9}}
Step 10 - Quality Validation: {{step10}}

CRITICAL INSTRUCTIONS:
- DELIVER the COMPLETE, FULL-LENGTH research report from start to finish
- DO NOT provide analysis, commentary, or meta-discussion about the process
- DO NOT explain what you're doing or provide process descriptions
- DO NOT provide just a summary or conclusion - write the ENTIRE research report
- Begin immediately with the research report content and include every section
- Include ALL verified sources and citations in proper format throughout
- Integrate ALL research findings, data, and insights from the entire workflow
- Address the original research request comprehensively

MANDATORY COMPLETE RESEARCH REPORT STRUCTURE:
You MUST include ALL of these components in your response:

1. **RESEARCH REPORT TITLE** - Clear, professional title

2. **EXECUTIVE SUMMARY** (3-4 comprehensive paragraphs)
   - Overview of research objectives
   - Key findings summary
   - Major recommendations
   - Strategic implications

3. **RESEARCH OBJECTIVES & METHODOLOGY** (Full section)
   - Detailed explanation of research goals
   - Methodology used for data collection
   - Scope and limitations
   - Quality assurance measures

4. **KEY FINDINGS & INSIGHTS** (Multiple comprehensive subsections)
   - All major discoveries with full supporting data
   - Statistical findings with context
   - Expert insights and opinions
   - Trend analysis and patterns
   - Each finding fully developed with evidence

5. **DETAILED ANALYSIS & INTERPRETATION** (Multiple sections)
   - In-depth analysis of all collected data
   - Pattern recognition and correlations
   - Cause-effect relationships
   - Cross-source validation results
   - Significance of findings

6. **STRATEGIC RECOMMENDATIONS & IMPLEMENTATION** (Full section)
   - Specific, actionable recommendations
   - Implementation roadmap and timeline
   - Resource requirements
   - Success metrics and KPIs
   - Risk mitigation strategies

7. **RISK ASSESSMENT & MITIGATION** (Full section)
   - Identified risks and challenges
   - Mitigation strategies for each risk
   - Contingency planning
   - Confidence levels for recommendations

8. **MARKET/INDUSTRY CONTEXT** (If applicable)
   - Current market conditions
   - Competitive landscape
   - Industry trends and implications
   - Future outlook and scenarios

9. **CONCLUSION & FUTURE IMPLICATIONS** (2-3 paragraphs)
   - Summary of most critical insights
   - Long-term implications
   - Areas for future research
   - Final strategic perspective

10. **COMPLETE REFERENCES & BIBLIOGRAPHY** (Organized alphabetically)
    - All sources used with full citation details
    - Source reliability ratings
    - Access dates and URLs

11. **APPENDICES** (If substantial supporting data exists)
    - Detailed methodology notes
    - Additional statistical tables
    - Supporting charts and graphs (described)
    - Extended data sets

CONTENT REQUIREMENTS:
- MINIMUM 2000-3000 words for comprehensive research reports
- Complete coverage of all research conducted during the workflow
- ALL sources properly cited throughout: [Source: Publication Name, Article Title, Date, URL]
- Professional research report formatting and presentation
- Logical progression from objectives through findings to recommendations
- Every major claim, statistic, and insight properly sourced with confidence levels
- Actionable insights and practical recommendations throughout

CITATION FORMAT THROUGHOUT:
- Use in-text citations throughout: [Source: Publication Name, Article Title, Date, URL]
- Include complete references section organized alphabetically
- Ensure every major claim, statistic, and insight is properly sourced
- Include confidence levels and source reliability assessments where appropriate

WHAT THIS MEANS:
Write the ENTIRE research report - not just an outline, not just key findings, not just a conclusion with sources. Include the full executive summary, detailed methodology, comprehensive findings sections, in-depth analysis, complete recommendations, and proper conclusion. The user should receive a complete, professional research report that thoroughly addresses their research request.

Begin writing the complete research report immediately - start with the title and write every section in full detail:`,
  },
];

/**
 * Get enhanced scenario by ID
 */
export function getEnhancedScenario(id: string): WorkflowStep[] | null {
  switch (id) {
    case "enhanced-article":
      return enhancedArticleWorkflow;
    case "enhanced-research":
      return enhancedResearchWorkflow;
    default:
      return null;
  }
}
