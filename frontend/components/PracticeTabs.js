"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BattlePracticeArea from './BattlePracticeArea';
import TopicSelector from './TopicSelector';
import PracticeArea from './PracticeArea';

const T = {
  bg: '#ffffff',
  fg: '#000000',
  border: '#eaeaea',
  gray: '#666666',
  lightGray: '#fafafa',
  success: '#0070f3',
  error: '#ff0000',
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export default function PracticeTabs({ onBack, studentClass, syllabusTopics = {}, initialTopics = null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState('quick');
  const [weakTopics, setWeakTopics] = useState({});
  const [topicsLoading, setTopicsLoading] = useState(true);
  
  // Quick Practice state
  const [quickTopicSelection, setQuickTopicSelection] = useState(null);
  const [quickPracticeSet, setQuickPracticeSet] = useState(null);
  const [isGeneratingQuick, setIsGeneratingQuick] = useState(false);
  const processedInitialTopics = useRef(null);
  
  // Load weak topics
  useEffect(() => {
    fetch(`${API_URL}/api/profile`)
      .then(r => r.json())
      .then(data => { if (data?.weakTopics) setWeakTopics(data.weakTopics); })
      .catch(() => {})
      .finally(() => setTopicsLoading(false));
  }, []);
  
  // Auto-start if initialTopics provided from parent
  useEffect(() => {
    console.log('PracticeTabs: initialTopics changed:', initialTopics);
    console.log('Current state - quickTopicSelection:', quickTopicSelection, 'quickPracticeSet:', quickPracticeSet, 'isGeneratingQuick:', isGeneratingQuick);
    
    // Check if we've already processed these topics
    const topicsKey = initialTopics ? JSON.stringify(initialTopics) : null;
    if (topicsKey && topicsKey === processedInitialTopics.current) {
      console.log('PracticeTabs: Already processed these topics, skipping');
      return;
    }
    
    if (initialTopics && initialTopics.topics && initialTopics.topics.length > 0 && !quickTopicSelection && !quickPracticeSet && !isGeneratingQuick) {
      console.log('PracticeTabs: Auto-starting with topics:', initialTopics.topics, 'types:', initialTopics.selectedTypes);
      processedInitialTopics.current = topicsKey;
      const selection = {
        mode: 'CHOOSE',
        topics: initialTopics.topics,
        selectedTypes: initialTopics.selectedTypes || ['Multiple Choice'],
        subject: 'Mixed'
      };
      setQuickTopicSelection(selection);
      generateQuickPractice(selection);
    }
  }, [initialTopics, quickTopicSelection, quickPracticeSet, isGeneratingQuick]);
  
  // Read URL params
  useEffect(() => {
    const mode = searchParams.get('mode') || 'quick';
    const topicsParam = searchParams.get('topics');
    
    setActiveTab(mode);
    
    // Auto-start Quick Practice if topics provided
    if (mode === 'quick' && topicsParam && !quickTopicSelection && !quickPracticeSet && !isGeneratingQuick) {
      const topics = topicsParam.split(',').map(t => t.trim());
      const selection = {
        mode: 'CHOOSE',
        topics,
        subject: 'Mixed'
      };
      setQuickTopicSelection(selection);
      generateQuickPractice(selection);
    }
  }, [searchParams, quickTopicSelection, quickPracticeSet, isGeneratingQuick]);
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    router.push(`?mode=${tab}`, { scroll: false });
    
    // Reset states when switching tabs
    if (tab === 'quick') {
      setQuickTopicSelection(null);
      setQuickPracticeSet(null);
      setIsGeneratingQuick(false);
    }
  };
  
  const generateQuickPractice = async (selection) => {
    console.log('generateQuickPractice called with:', selection);
    setIsGeneratingQuick(true);
    try {
      const payload = {
        topics: selection.topics,
        studentClass: studentClass || '6th CBSE',
        selectedTypes: selection.selectedTypes || ['Multiple Choice']
      };
      console.log('Sending request to API:', payload);
      
      const res = await fetch(`${API_URL}/api/generate-practice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      console.log('Received response:', data);
      
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to generate questions');
      }
      
      setQuickPracticeSet(data);
    } catch (error) {
      console.error('Error generating practice:', error);
      alert('Failed to generate practice questions. Please try again.');
      // Reset state on error
      setQuickTopicSelection(null);
      setQuickPracticeSet(null);
    } finally {
      setIsGeneratingQuick(false);
    }
  };
  
  const handleQuickTopicSelect = (selection) => {
    setQuickTopicSelection(selection);
    generateQuickPractice(selection);  // Immediately generate questions
  };
  
  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Tab Header */}
      <div style={{ 
        display: 'flex', 
        gap: 8, 
        marginBottom: 24,
        borderBottom: `1px solid ${T.border}`,
        paddingBottom: 0
      }}>
        <button
          onClick={() => handleTabChange('quick')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'none',
            borderBottom: `2px solid ${activeTab === 'quick' ? T.fg : 'transparent'}`,
            color: activeTab === 'quick' ? T.fg : T.gray,
            fontFamily: 'Inter',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: -1
          }}
        >
          📚 Quick Practice
        </button>
        <button
          onClick={() => handleTabChange('battle')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'none',
            borderBottom: `2px solid ${activeTab === 'battle' ? T.fg : 'transparent'}`,
            color: activeTab === 'battle' ? T.fg : T.gray,
            fontFamily: 'Inter',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: -1
          }}
        >
          ⚡ Battle Mode
        </button>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'quick' && (
        <div>
          {!quickTopicSelection && (
            <TopicSelector
              onSelect={handleQuickTopicSelect}
              weakTopics={weakTopics}
              loading={topicsLoading}
              studentClass={studentClass || '7th CBSE'}
            />
          )}
          
          {isGeneratingQuick && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ 
                width: 40, 
                height: 40, 
                border: `3px solid ${T.border}`, 
                borderTopColor: T.fg, 
                borderRadius: '50%', 
                display: 'inline-block', 
                animation: 'sp-spin 0.8s linear infinite', 
                marginBottom: 20 
              }} />
              <p style={{ 
                fontFamily: 'Inter', 
                fontSize: 15, 
                fontWeight: 500, 
                color: T.fg 
              }}>
                Generating practice questions...
              </p>
              <style dangerouslySetInnerHTML={{ __html: `@keyframes sp-spin { to { transform: rotate(360deg); } }` }} />
            </div>
          )}
          
          {quickPracticeSet && !isGeneratingQuick && (
            <PracticeArea
              practiceSet={quickPracticeSet}
              onBack={() => {
                // Reset local state
                setQuickTopicSelection(null);
                setQuickPracticeSet(null);
                // Call parent onBack to go back to review and clear practiceTopics
                if (onBack) onBack();
              }}
              onReattempt={() => generateQuickPractice(quickTopicSelection)}
            />
          )}
        </div>
      )}
      
      {activeTab === 'battle' && (
        <BattlePracticeArea
          onBack={onBack}
          studentClass={studentClass}
          syllabusTopics={syllabusTopics}
        />
      )}
    </div>
  );
}
