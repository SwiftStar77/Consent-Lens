'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Header } from '@/components/Header';
import { InputPanel } from '@/components/InputPanel';
import { ResultsPanel } from '@/components/ResultsPanel';
import {
  AnalysisResult,
  RiskItem,
  RiskSeverity,
  RiskTolerance,
  UsageContext,
  UserPersona,
} from '@/lib/types';
import { recalculateRiskScore } from '@/lib/analyzer';
import { analyzeDeeply } from '@/lib/deepAnalyzer';

export default function HomePage() {
  // Navigation Stage: 'input' (Stage 1) or 'results' (Stage 2)
  const [currentStage, setCurrentStage] = useState<'input' | 'results'>('input');

  // Input states
  const [inputMode, setInputMode] = useState<'text' | 'url'>('text');
  const [policyText, setPolicyText] = useState<string>('');
  const [urlInput, setUrlInput] = useState<string>('');

  // Default Persona & Context Controls (standardized internally)
  const [persona] = useState<UserPersona>('everyday');
  const [context] = useState<UsageContext>('utility');
  const [riskTolerance] = useState<RiskTolerance>('standard');

  // Analysis result & simulator states
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [simulatedFindings, setSimulatedFindings] = useState<RiskItem[]>([]);
  const [simulatedScore, setSimulatedScore] = useState<number>(0);
  const [simulatedSeverity, setSimulatedSeverity] = useState<RiskSeverity>('safe');
  const [scoreDelta, setScoreDelta] = useState<number>(0);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Client-side cache to avoid redundant API or analysis calls
  const cacheRef = useRef<Map<string, AnalysisResult>>(new Map());

  const executeAnalysis = useCallback(async () => {
    setErrorMessage(null);

    const isUrl = inputMode === 'url';
    const textToAnalyze = isUrl ? urlInput.trim() : policyText.trim();

    if (!textToAnalyze) {
      setErrorMessage(
        isUrl
          ? 'Please enter a valid web address or app link.'
          : 'Please paste policy or permission text to analyze.'
      );
      return;
    }

    if (!isUrl && textToAnalyze.length < 10) {
      setErrorMessage('Please paste at least 10 characters of policy or permission text.');
      return;
    }

    setIsLoading(true);

    const cacheKey = `${inputMode}:${persona}:${context}:${riskTolerance}:${textToAnalyze}`;
    if (cacheRef.current.has(cacheKey)) {
      const cached = cacheRef.current.get(cacheKey)!;
      setAnalysisResult(cached);
      setSimulatedFindings(cached.findings);
      setSimulatedScore(cached.score);
      setSimulatedSeverity(cached.verdictSeverity);
      setScoreDelta(0);
      setIsLoading(false);
      setCurrentStage('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputMode,
          policyText: isUrl ? undefined : textToAnalyze,
          url: isUrl ? textToAnalyze : undefined,
          persona,
          context,
          riskTolerance,
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
          setCurrentStage('results');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        } else if (json.error) {
          const fullErr = json.hint ? `${json.error} ${json.hint}` : json.error;
          setErrorMessage(fullErr);
          setIsLoading(false);
          return;
        }
      } else {
        const errorData = await res.json().catch(() => null);
        if (errorData?.error) {
          const fullErr = errorData.hint ? `${errorData.error} ${errorData.hint}` : errorData.error;
          setErrorMessage(fullErr);
          setIsLoading(false);
          return;
        }
      }
    } catch {
      // Offline or network error: fall back to Deep Local Clause Analyzer
    }

    // Client-side fallback via deep analyzer
    if (!isUrl && textToAnalyze.length >= 10) {
      const fallbackResult = analyzeDeeply(textToAnalyze, persona, context, riskTolerance);
      cacheRef.current.set(cacheKey, fallbackResult);
      setAnalysisResult(fallbackResult);
      setSimulatedFindings(fallbackResult.findings);
      setSimulatedScore(fallbackResult.score);
      setSimulatedSeverity(fallbackResult.verdictSeverity);
      setScoreDelta(0);
      setIsLoading(false);
      setCurrentStage('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setErrorMessage(
      'Unable to connect to the analysis service. Please verify your connection or paste the policy text directly.'
    );
    setIsLoading(false);
  }, [inputMode, policyText, urlInput, persona, context, riskTolerance]);

  const handleClear = () => {
    setPolicyText('');
    setUrlInput('');
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

  const handleBackToInput = () => {
    setCurrentStage('input');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header onResetToHome={handleBackToInput} />

      <main role="main" style={{ flex: 1, padding: '1rem 1rem 3rem 1rem' }}>
        {currentStage === 'input' ? (
          <InputPanel
            inputMode={inputMode}
            setInputMode={setInputMode}
            policyText={policyText}
            setPolicyText={setPolicyText}
            urlInput={urlInput}
            setUrlInput={setUrlInput}
            onAnalyze={executeAnalysis}
            onClear={handleClear}
            isLoading={isLoading}
            errorMessage={errorMessage}
          />
        ) : (
          analysisResult && (
            <ResultsPanel
              result={analysisResult}
              simulatedScore={simulatedScore}
              simulatedSeverity={simulatedSeverity}
              scoreDelta={scoreDelta}
              findings={simulatedFindings}
              onToggleFinding={handleToggleFinding}
              onResetSimulator={handleResetSimulator}
              onBack={handleBackToInput}
              persona={persona}
            />
          )
        )}
      </main>

      <footer
        role="contentinfo"
        style={{
          borderTop: '1px solid var(--border-card-subtle)',
          padding: '1.25rem 1rem',
          textAlign: 'center',
          fontSize: '0.8125rem',
          color: 'var(--text-secondary)',
        }}
      >
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <strong>ConsentLens</strong> — Context-aware digital safety and consent auditor. Built for PromptWars X Noor AITH.
        </div>
      </footer>
    </div>
  );
}
