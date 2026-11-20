'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { InputPanel } from '@/components/InputPanel';
import { ResultsPanel } from '@/components/ResultsPanel';
import { RiskSimulator } from '@/components/RiskSimulator';
import { SAMPLE_SCENARIOS } from '@/lib/samples';
import {
  AnalysisResult,
  RiskItem,
  RiskSeverity,
  RiskTolerance,
  ScenarioSample,
  UsageContext,
  UserPersona,
} from '@/lib/types';
import { analyzeDeterministically, recalculateRiskScore } from '@/lib/analyzer';

export default function HomePage() {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>('predatory_loan');
  const [persona, setPersona] = useState<UserPersona>('everyday');
  const [context, setContext] = useState<UsageContext>('finance');
  const [riskTolerance, setRiskTolerance] = useState<RiskTolerance>('standard');
  const [policyText, setPolicyText] = useState<string>(SAMPLE_SCENARIOS[0].content);

  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [simulatedFindings, setSimulatedFindings] = useState<RiskItem[]>([]);
  const [simulatedScore, setSimulatedScore] = useState<number>(0);
  const [simulatedSeverity, setSimulatedSeverity] = useState<RiskSeverity>('safe');
  const [scoreDelta, setScoreDelta] = useState<number>(0);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Client-side cache to avoid redundant API or analysis calls
  const cacheRef = useRef<Map<string, AnalysisResult>>(new Map());

  const executeAnalysis = useCallback(
    async (
      text: string,
      targetPersona: UserPersona,
      targetContext: UsageContext,
      targetTolerance: RiskTolerance
    ) => {
      const trimmed = text.trim();
      if (trimmed.length < 10) {
        setErrorMessage('Please paste at least 10 characters of policy or permission text.');
        return;
      }

      setErrorMessage(null);
      setIsLoading(true);

      const cacheKey = `${targetPersona}:${targetContext}:${targetTolerance}:${trimmed}`;
      if (cacheRef.current.has(cacheKey)) {
        const cached = cacheRef.current.get(cacheKey)!;
        setAnalysisResult(cached);
        setSimulatedFindings(cached.findings);
        setSimulatedScore(cached.score);
        setSimulatedSeverity(cached.verdictSeverity);
        setScoreDelta(0);
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            policyText: trimmed,
            persona: targetPersona,
            context: targetContext,
            riskTolerance: targetTolerance,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const data: AnalysisResult = json.data;
            cacheRef.current.set(cacheKey, data);
            setAnalysisResult(data);
            setSimulatedFindings(data.findings);
            setSimulatedScore(data.score);
            setSimulatedSeverity(data.verdictSeverity);
            setScoreDelta(0);
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // Network or route failure: fall back to local rule engine
      }

      // Local fallback engine execution
      const fallbackResult = analyzeDeterministically(
        trimmed,
        targetPersona,
        targetContext,
        targetTolerance
      );
      cacheRef.current.set(cacheKey, fallbackResult);
      setAnalysisResult(fallbackResult);
      setSimulatedFindings(fallbackResult.findings);
      setSimulatedScore(fallbackResult.score);
      setSimulatedSeverity(fallbackResult.verdictSeverity);
      setScoreDelta(0);
      setIsLoading(false);
    },
    []
  );

  // Auto-analyze initial sample on initial mount
  useEffect(() => {
    executeAnalysis(
      SAMPLE_SCENARIOS[0].content,
      SAMPLE_SCENARIOS[0].defaultPersona,
      SAMPLE_SCENARIOS[0].defaultContext,
      SAMPLE_SCENARIOS[0].defaultTolerance
    );
  }, [executeAnalysis]);

  const handleSelectScenario = (scenario: ScenarioSample) => {
    setSelectedScenarioId(scenario.id);
    setPolicyText(scenario.content);
    setPersona(scenario.defaultPersona);
    setContext(scenario.defaultContext);
    setRiskTolerance(scenario.defaultTolerance);
    executeAnalysis(
      scenario.content,
      scenario.defaultPersona,
      scenario.defaultContext,
      scenario.defaultTolerance
    );
  };

  const handleManualAnalyze = () => {
    executeAnalysis(policyText, persona, context, riskTolerance);
  };

  const handleClear = () => {
    setPolicyText('');
    setSelectedScenarioId(null);
    setAnalysisResult(null);
    setSimulatedFindings([]);
    setErrorMessage(null);
  };

  const handleToggleFinding = (id: string) => {
    const updated = simulatedFindings.map((f) =>
      f.id === id ? { ...f, isSimulatedDisabled: !f.isSimulatedDisabled } : f
    );
    setSimulatedFindings(updated);

    const recalc = recalculateRiskScore(updated, persona, context, riskTolerance);
    setSimulatedScore(recalc.recalculatedScore);
    setSimulatedSeverity(recalc.recalculatedSeverity);
    setScoreDelta(recalc.scoreDelta);
  };

  const handleResetSimulator = () => {
    if (!analysisResult) return;
    const reset = simulatedFindings.map((f) => ({ ...f, isSimulatedDisabled: false }));
    setSimulatedFindings(reset);
    setSimulatedScore(analysisResult.score);
    setSimulatedSeverity(analysisResult.verdictSeverity);
    setScoreDelta(0);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        onSelectScenario={handleSelectScenario}
        selectedScenarioId={selectedScenarioId}
      />

      <main className="app-container" role="main" style={{ flex: 1, width: '100%' }}>
        <div className="workspace-grid">
          {/* Left Column: Input and Parameters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <InputPanel
              policyText={policyText}
              setPolicyText={(val) => {
                setPolicyText(val);
                setSelectedScenarioId(null);
              }}
              persona={persona}
              setPersona={(p) => {
                setPersona(p);
                if (policyText.trim().length >= 10) {
                  executeAnalysis(policyText, p, context, riskTolerance);
                }
              }}
              context={context}
              setContext={(c) => {
                setContext(c);
                if (policyText.trim().length >= 10) {
                  executeAnalysis(policyText, persona, c, riskTolerance);
                }
              }}
              riskTolerance={riskTolerance}
              setRiskTolerance={(t) => {
                setRiskTolerance(t);
                if (policyText.trim().length >= 10) {
                  executeAnalysis(policyText, persona, context, t);
                }
              }}
              onAnalyze={handleManualAnalyze}
              onClear={handleClear}
              isLoading={isLoading}
              errorMessage={errorMessage}
            />

            {/* Interactive Risk Simulator placed in left column on desktop for direct tuning */}
            {analysisResult && (
              <RiskSimulator
                findings={simulatedFindings}
                onToggleFinding={handleToggleFinding}
                onResetSimulator={handleResetSimulator}
                originalScore={analysisResult.score}
                simulatedScore={simulatedScore}
                simulatedSeverity={simulatedSeverity}
                scoreDelta={scoreDelta}
              />
            )}
          </div>

          {/* Right Column: Decision, Verdict, Findings, Countermeasures & Opt-Out Letter */}
          <div>
            <ResultsPanel
              result={
                analysisResult
                  ? {
                      ...analysisResult,
                      score: simulatedScore,
                      verdictSeverity: simulatedSeverity,
                    }
                  : null
              }
              persona={persona}
              isLoading={isLoading}
            />
          </div>
        </div>
      </main>

      <footer
        role="contentinfo"
        style={{
          borderTop: '1px solid var(--border-stone)',
          backgroundColor: 'var(--bg-surface)',
          padding: '1rem',
          textAlign: 'center',
          fontSize: '0.8125rem',
          color: 'var(--text-secondary)',
        }}
      >
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          <strong>ConsentLens</strong> — Context-aware digital safety and consent copilot. Built for PromptWars X Noor AITH.
        </div>
      </footer>
    </div>
  );
}
