/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  ChevronRight, 
  ChevronLeft, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  ClipboardList, 
  GraduationCap,
  Lightbulb,
  Target,
  ArrowRight,
  RefreshCcw,
  Download,
  FileText
} from 'lucide-react';
import * as gemini from './lib/anthropic';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

type Phase = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface FormData {
  department: string;
  interest: string;
  activities: string;
  recommendedTopics: string;
  selectedTopic: string;
  recommendedMotivations: string;
  selectedMotivation: string;
  recommendedCompetencies: string;
  selectedCompetencies: string[]; // Changed to array for multiple selection
  recommendedFollowUps: string;
  selectedFollowUp: string;
  seTeukDraft: string;
  researchPlan: string;
}

const PHASES = [
  { id: 1, title: '기본 정보 입력', icon: GraduationCap },
  { id: 2, title: '탐구 주제 추천', icon: Lightbulb },
  { id: 3, title: '동기 확인', icon: Target },
  { id: 4, title: '핵심 역량 확인', icon: Sparkles },
  { id: 5, title: '탐구 후속활동', icon: BookOpen },
  { id: 6, title: '세특 초안 작성', icon: ClipboardList },
  { id: 7, title: '최종 결과 확인', icon: CheckCircle2 },
];

const TIPS: Record<number, { expert: string; writing: string }> = {
  1: {
    expert: "희망 학과와 관련된 최근 이슈나 교과서의 '심화 탐구' 섹션을 참고해 보세요.",
    writing: "학생의 평소 관심사가 어떻게 교과 활동으로 이어졌는지 보여주는 시작점입니다."
  },
  2: {
    expert: "너무 넓은 주제보다는 실생활의 구체적인 현상을 분석하는 주제가 좋은 평가를 받습니다.",
    writing: "주제 명칭만으로도 탐구의 깊이와 방향성이 드러나도록 구체적으로 기술하세요."
  },
  3: {
    expert: "단순히 '궁금해서'보다는 '수업 중 배운 ~개념을 확장하기 위해'와 같은 학술적 동기가 좋습니다.",
    writing: "자기주도적 학습 태도와 지적 호기심이 드러나도록 동기를 서술하는 것이 핵심입니다."
  },
  4: {
    expert: "선택한 역량이 탐구 과정에서 어떻게 발휘되었는지 구체적인 행동 지표로 보여줘야 합니다.",
    writing: "역량의 명칭보다는 해당 역량을 증명할 수 있는 구체적인 활동 사례를 문장에 녹여내세요."
  },
  5: {
    expert: "탐구로 끝내지 않고 관련 도서를 찾아보거나 실험을 설계하는 등 '확장성'을 보여주세요.",
    writing: "탐구 이후의 변화와 성장을 언급하여 학업에 대한 열정과 발전 가능성을 강조하세요."
  },
  6: {
    expert: "작성된 초안을 바탕으로 본인이 실제로 수행할 수 있는 수준인지 검토하고 내용을 보완하세요.",
    writing: "교사가 관찰한 구체적 행동 위주로 서술하며, '~함', '~임'과 같은 명사형 종결 어미를 사용하세요."
  }
};

export default function App() {
  const [currentPhase, setCurrentPhase] = useState<Phase>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    department: '',
    interest: '',
    activities: '',
    recommendedTopics: '',
    selectedTopic: '',
    recommendedMotivations: '',
    selectedMotivation: '',
    recommendedCompetencies: '',
    selectedCompetencies: [],
    recommendedFollowUps: '',
    selectedFollowUp: '',
    seTeukDraft: '',
    researchPlan: '',
  });

  // Load from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('seTeukFormData');
    const savedPhase = localStorage.getItem('seTeukCurrentPhase');
    if (savedData) {
      try {
        setFormData(JSON.parse(savedData));
      } catch (e) {
        console.error('Failed to load saved data', e);
      }
    }
    if (savedPhase) {
      setCurrentPhase(parseInt(savedPhase) as Phase);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('seTeukFormData', JSON.stringify(formData));
    localStorage.setItem('seTeukCurrentPhase', currentPhase.toString());
  }, [formData, currentPhase]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      if (currentPhase === 2) {
        const topics = await gemini.generateTopics(formData.department, formData.interest, formData.activities);
        setFormData(prev => ({ ...prev, recommendedTopics: topics, selectedTopic: '' }));
      } else if (currentPhase === 3) {
        const motivations = await gemini.generateMotivations(formData.selectedTopic);
        setFormData(prev => ({ ...prev, recommendedMotivations: motivations, selectedMotivation: '' }));
      } else if (currentPhase === 4) {
        const competencies = await gemini.generateCompetencies(formData.selectedTopic);
        setFormData(prev => ({ ...prev, recommendedCompetencies: competencies, selectedCompetencies: [] }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    if (currentPhase === 1) {
      if (!formData.department || !formData.interest) return;
      setIsLoading(true);
      try {
        const topics = await gemini.generateTopics(formData.department, formData.interest, formData.activities);
        setFormData(prev => ({ ...prev, recommendedTopics: topics }));
        setCurrentPhase(2);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    } else if (currentPhase === 2) {
      if (!formData.selectedTopic) return;
      setIsLoading(true);
      try {
        const motivations = await gemini.generateMotivations(formData.selectedTopic);
        setFormData(prev => ({ ...prev, recommendedMotivations: motivations }));
        setCurrentPhase(3);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    } else if (currentPhase === 3) {
      if (!formData.selectedMotivation) return;
      setIsLoading(true);
      try {
        const competencies = await gemini.generateCompetencies(formData.selectedTopic);
        setFormData(prev => ({ ...prev, recommendedCompetencies: competencies }));
        setCurrentPhase(4);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    } else if (currentPhase === 4) {
      if (formData.selectedCompetencies.length === 0) return;
      setIsLoading(true);
      try {
        const followUps = await gemini.generateFollowUps(formData.selectedTopic);
        setFormData(prev => ({ ...prev, recommendedFollowUps: followUps }));
        setCurrentPhase(5);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    } else if (currentPhase === 5) {
      if (!formData.selectedFollowUp) return;
      setIsLoading(true);
      try {
        const seTeuk = await gemini.generateSeTeuk({
          topic: formData.selectedTopic,
          motivation: formData.selectedMotivation,
          competency: formData.selectedCompetencies.join('\n'),
          followUp: formData.selectedFollowUp
        });
        setFormData(prev => ({ ...prev, seTeukDraft: seTeuk }));
        setCurrentPhase(6);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    } else if (currentPhase === 6) {
      setIsLoading(true);
      try {
        const plan = await gemini.generateResearchPlan({
          topic: formData.selectedTopic,
          motivation: formData.selectedMotivation,
          competency: formData.selectedCompetencies.join('\n'),
          followUp: formData.selectedFollowUp,
          seTeuk: formData.seTeukDraft
        });
        setFormData(prev => ({ ...prev, researchPlan: plan }));
        setCurrentPhase(7);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (currentPhase > 1) {
      setCurrentPhase((prev) => (prev - 1) as Phase);
    }
  };

  const reset = () => {
    if (confirm('모든 내용이 초기화되고 처음부터 다시 시작합니다. 계속하시겠습니까?')) {
      const emptyData = {
        department: '',
        interest: '',
        activities: '',
        recommendedTopics: '',
        selectedTopic: '',
        recommendedMotivations: '',
        selectedMotivation: '',
        recommendedCompetencies: '',
        selectedCompetencies: [],
        recommendedFollowUps: '',
        selectedFollowUp: '',
        seTeukDraft: '',
        researchPlan: '',
      };
      setFormData(emptyData);
      setCurrentPhase(1);
      localStorage.removeItem('seTeukFormData');
      localStorage.removeItem('seTeukCurrentPhase');
    }
  };

  const toggleCompetency = (compStr: string) => {
    setFormData(prev => {
      const isSelected = prev.selectedCompetencies.includes(compStr);
      if (isSelected) {
        return { ...prev, selectedCompetencies: prev.selectedCompetencies.filter(c => c !== compStr) };
      } else {
        return { ...prev, selectedCompetencies: [...prev.selectedCompetencies, compStr] };
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      {/* Sidebar - Progress Tracker */}
      <aside className="w-full md:w-80 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 shrink-0">
            <Sparkles size={24} />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-800 leading-tight">
            세특 주제 선정 및<br />예상 보고서 작성 도우미
          </h1>
        </div>

        <nav className="flex-1 space-y-2">
          {PHASES.map((phase) => {
            const Icon = phase.icon;
            const isActive = currentPhase === phase.id;
            const isCompleted = currentPhase > phase.id;

            return (
              <div
                key={phase.id}
                className={`flex items-center gap-4 p-3 rounded-lg transition-all duration-200 ${
                  isActive ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-400'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  isActive ? 'bg-indigo-600 text-white' : isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  {isCompleted ? <CheckCircle2 size={16} /> : phase.id}
                </div>
                <span className={`font-medium ${isActive ? 'text-indigo-900' : ''}`}>{phase.title}</span>
              </div>
            );
          })}
        </nav>

        <div className="mt-auto pt-8 border-t border-slate-100">
          <button 
            onClick={reset}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all mb-6 shadow-sm active:scale-95"
          >
            <RefreshCcw size={18} />
            처음부터 다시하기
          </button>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Created By</p>
            <p className="text-xs font-semibold text-slate-600 leading-relaxed">
              숭신고등학교 진로진학상담부<br />
              <span className="text-indigo-600">김강석</span>
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-12">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPhase}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
            >
              {/* Phase Header */}
              <div className="bg-slate-50 border-b border-slate-100 px-8 py-6">
                <h2 className="text-2xl font-bold text-slate-800">
                  Phase {currentPhase}. {PHASES[currentPhase - 1].title}
                </h2>
                <p className="text-slate-500 mt-1">
                  {currentPhase === 1 && '희망 학과와 관심 있는 주제를 입력해 주세요.'}
                  {currentPhase === 2 && '입력하신 정보를 바탕으로 추천된 주제 중 하나를 선택해 주세요.'}
                  {currentPhase === 3 && '탐구 활동의 시작이 될 동기를 선택해 주세요.'}
                  {currentPhase === 4 && '강조하고 싶은 역량을 모두 선택해 주세요. (복수 선택 가능)'}
                  {currentPhase === 5 && '탐구 이후 심화할 수 있는 후속 활동을 선택해 주세요.'}
                  {currentPhase === 6 && '완성된 세특 초안입니다. 내용을 확인해 보세요.'}
                  {currentPhase === 7 && '탐구 계획서와 세특 초안이 최종 완성되었습니다.'}
                </p>
              </div>

              {/* Phase Content */}
              <div className="p-8">
                {currentPhase === 1 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <GraduationCap size={16} className="text-indigo-500" />
                        희망 학과
                      </label>
                      <input
                        type="text"
                        placeholder="예: 컴퓨터공학과, 생명과학과 등"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Lightbulb size={16} className="text-amber-500" />
                        평소 탐구하고자 하는 주제나 호기심
                      </label>
                      <textarea
                        rows={3}
                        placeholder="예: 인공지능의 윤리적 문제, 유전자 가위 기술의 발전 등"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                        value={formData.interest}
                        onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <ClipboardList size={16} className="text-emerald-500" />
                        기존에 해본 관련된 활동 (선택 사항)
                      </label>
                      <textarea
                        rows={3}
                        placeholder="예: 수학 시간에 배운 미분 개념을 활용한 물리 문제 해결 등"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                        value={formData.activities}
                        onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {currentPhase === 2 && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">추천 주제 리스트</h3>
                      <button 
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <RefreshCcw size={14} className={isLoading ? 'animate-spin' : ''} />
                        새로운 주제 추천받기
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {(() => {
                        try {
                          const data = JSON.parse(formData.recommendedTopics);
                          return data.topics.map((topic: any, index: number) => (
                            <button
                              key={index}
                              onClick={() => setFormData({ ...formData, selectedTopic: topic.title })}
                              className={`text-left p-5 rounded-xl border-2 transition-all duration-200 ${
                                formData.selectedTopic === topic.title
                                  ? 'border-indigo-600 bg-indigo-50 shadow-md'
                                  : 'border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-white'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-indigo-900">{topic.title}</h4>
                                {formData.selectedTopic === topic.title && (
                                  <CheckCircle2 size={20} className="text-indigo-600" />
                                )}
                              </div>
                              <p className="text-sm text-slate-600 leading-relaxed">{topic.description}</p>
                            </button>
                          ));
                        } catch (e) {
                          return <p className="text-sm text-red-500">데이터를 불러오는 중 오류가 발생했습니다.</p>;
                        }
                      })()}
                    </div>
                    <div className="pt-4 border-t border-slate-100">
                      <label className="text-sm font-semibold text-slate-700 mb-2 block">직접 수정하거나 확정된 주제</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        value={formData.selectedTopic}
                        onChange={(e) => setFormData({ ...formData, selectedTopic: e.target.value })}
                        placeholder="위 추천 주제를 클릭하거나 직접 입력하세요."
                      />
                    </div>
                  </div>
                )}

                {currentPhase === 3 && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">추천 동기 리스트</h3>
                      <button 
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <RefreshCcw size={14} className={isLoading ? 'animate-spin' : ''} />
                        새로운 동기 추천받기
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {(() => {
                        try {
                          const data = JSON.parse(formData.recommendedMotivations);
                          return data.motivations.map((mot: any, index: number) => (
                            <button
                              key={index}
                              onClick={() => setFormData({ ...formData, selectedMotivation: mot.content })}
                              className={`text-left p-5 rounded-xl border-2 transition-all duration-200 ${
                                formData.selectedMotivation === mot.content
                                  ? 'border-indigo-600 bg-indigo-50 shadow-md'
                                  : 'border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-white'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                                  {mot.type}
                                </span>
                                {formData.selectedMotivation === mot.content && (
                                  <CheckCircle2 size={16} className="text-indigo-600 ml-auto" />
                                )}
                              </div>
                              <p className="text-sm text-slate-700 leading-relaxed">{mot.content}</p>
                            </button>
                          ));
                        } catch (e) {
                          return <p className="text-sm text-red-500">데이터를 불러오는 중 오류가 발생했습니다.</p>;
                        }
                      })()}
                    </div>
                    <div className="pt-4 border-t border-slate-100">
                      <label className="text-sm font-semibold text-slate-700 mb-2 block">선택한 탐구 동기 수정</label>
                      <textarea
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                        value={formData.selectedMotivation}
                        onChange={(e) => setFormData({ ...formData, selectedMotivation: e.target.value })}
                        placeholder="위 유형 중 하나를 선택하거나 내용을 다듬어 입력해 주세요."
                      />
                    </div>
                  </div>
                )}

                {currentPhase === 4 && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">추천 역량 리스트</h3>
                      <button 
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <RefreshCcw size={14} className={isLoading ? 'animate-spin' : ''} />
                        새로운 역량 추천받기
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {(() => {
                        try {
                          const data = JSON.parse(formData.recommendedCompetencies);
                          return data.competencies.map((comp: any, index: number) => {
                            const compStr = `${comp.name}: ${comp.behavior}`;
                            const isSelected = formData.selectedCompetencies.includes(compStr);
                            return (
                              <button
                                key={index}
                                onClick={() => toggleCompetency(compStr)}
                                className={`text-left p-5 rounded-xl border-2 transition-all duration-200 ${
                                  isSelected
                                    ? 'border-indigo-600 bg-indigo-50 shadow-md'
                                    : 'border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-white'
                                }`}
                              >
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="font-bold text-indigo-900">{comp.name}</h4>
                                  {isSelected && (
                                    <CheckCircle2 size={20} className="text-indigo-600" />
                                  )}
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed">{comp.behavior}</p>
                              </button>
                            );
                          });
                        } catch (e) {
                          return <p className="text-sm text-red-500">데이터를 불러오는 중 오류가 발생했습니다.</p>;
                        }
                      })()}
                    </div>
                    <div className="pt-4 border-t border-slate-100">
                      <label className="text-sm font-semibold text-slate-700 mb-2 block">선택된 핵심 역량 (수정 가능)</label>
                      <textarea
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                        value={formData.selectedCompetencies.join('\n')}
                        readOnly
                        placeholder="위 역량 카드를 클릭하여 선택해 주세요."
                      />
                    </div>
                  </div>
                )}

                {currentPhase === 5 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                      {(() => {
                        try {
                          const data = JSON.parse(formData.recommendedFollowUps);
                          return data.followUps.map((fu: any, index: number) => (
                            <button
                              key={index}
                              onClick={() => setFormData({ ...formData, selectedFollowUp: fu.content })}
                              className={`text-left p-5 rounded-xl border-2 transition-all duration-200 ${
                                formData.selectedFollowUp === fu.content
                                  ? 'border-indigo-600 bg-indigo-50 shadow-md'
                                  : 'border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-white'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                                  {fu.type}
                                </span>
                                {formData.selectedFollowUp === fu.content && (
                                  <CheckCircle2 size={16} className="text-indigo-600 ml-auto" />
                                )}
                              </div>
                              <p className="text-sm text-slate-700 leading-relaxed">{fu.content}</p>
                            </button>
                          ));
                        } catch (e) {
                          return <p className="text-sm text-red-500">데이터를 불러오는 중 오류가 발생했습니다.</p>;
                        }
                      })()}
                    </div>
                    <div className="pt-4 border-t border-slate-100">
                      <label className="text-sm font-semibold text-slate-700 mb-2 block">최종 선택한 후속 활동 수정</label>
                      <textarea
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                        value={formData.selectedFollowUp}
                        onChange={(e) => setFormData({ ...formData, selectedFollowUp: e.target.value })}
                        placeholder="실행할 후속 활동 내용을 입력해 주세요."
                      />
                    </div>
                  </div>
                )}

                {currentPhase === 6 && (
                  <div className="space-y-4">
                    <div className="bg-slate-900 text-slate-100 p-6 rounded-xl font-mono text-sm leading-relaxed border border-slate-800 shadow-inner">
                      {formData.seTeukDraft}
                    </div>
                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => navigator.clipboard.writeText(formData.seTeukDraft)}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <ClipboardList size={14} />
                        클립보드 복사
                      </button>
                    </div>
                  </div>
                )}

                {currentPhase === 7 && (
                  <div className="space-y-12">
                    {/* Research Plan Section */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-2 border-b-2 border-indigo-600 pb-2">
                        <ClipboardList className="text-indigo-600" size={24} />
                        <h3 className="text-xl font-bold text-slate-800">탐구 계획서</h3>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                              <th className="px-6 py-4 text-left text-sm font-bold text-slate-600 w-1/4">구분</th>
                              <th className="px-6 py-4 text-left text-sm font-bold text-slate-600">내용</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(() => {
                              try {
                                const data = JSON.parse(formData.researchPlan);
                                return data.plan.map((item: any, index: number) => (
                                  <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-bold text-indigo-900 bg-indigo-50/30">{item.category}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700 leading-relaxed">
                                      {item.isStepByStep ? (
                                        <div className="space-y-4 py-2">
                                          {item.steps.map((step: any, sIdx: number) => (
                                            <div key={sIdx} className="flex gap-4 items-start">
                                              <div className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded shrink-0 mt-0.5">
                                                {step.step}
                                              </div>
                                              <div>
                                                <p className="font-bold text-slate-900 text-xs mb-1">{step.title}</p>
                                                <p className="text-xs text-slate-600">{step.description}</p>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="whitespace-pre-wrap">{item.content}</div>
                                      )}
                                    </td>
                                  </tr>
                                ));
                              } catch (e) {
                                return (
                                  <tr>
                                    <td colSpan={2} className="px-6 py-8 text-center text-slate-400 italic">계획서 데이터를 불러올 수 없습니다.</td>
                                  </tr>
                                );
                              }
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </section>

                    {/* SeTeuk Draft Section */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-2 border-b-2 border-emerald-600 pb-2">
                        <Sparkles className="text-emerald-600" size={24} />
                        <h3 className="text-xl font-bold text-slate-800">세특 초안 (교사 관점)</h3>
                      </div>
                      <div className="bg-emerald-50/30 border border-emerald-100 rounded-xl p-8 shadow-sm">
                        <div className="text-slate-800 text-sm leading-relaxed font-sans italic">
                          {formData.seTeukDraft}
                        </div>
                      </div>
                    </section>

                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                      <button 
                        onClick={async () => {
                          try {
                            const planData = JSON.parse(formData.researchPlan);
                            
                            const doc = new Document({
                              sections: [{
                                properties: {},
                                children: [
                                  new Paragraph({
                                    text: "탐구 계획서",
                                    heading: HeadingLevel.HEADING_1,
                                    alignment: AlignmentType.CENTER,
                                    spacing: { after: 400 }
                                  }),
                                  new Table({
                                    width: { size: 100, type: WidthType.PERCENTAGE },
                                    rows: [
                                      new TableRow({
                                        children: [
                                          new TableCell({
                                            children: [new Paragraph({ children: [new TextRun({ text: "구분", bold: true })], alignment: AlignmentType.CENTER })],
                                            shading: { fill: "F8FAFC" },
                                            width: { size: 25, type: WidthType.PERCENTAGE }
                                          }),
                                          new TableCell({
                                            children: [new Paragraph({ children: [new TextRun({ text: "내용", bold: true })], alignment: AlignmentType.CENTER })],
                                            shading: { fill: "F8FAFC" }
                                          })
                                        ]
                                      }),
                                      ...planData.plan.map((item: any) => (
                                        new TableRow({
                                          children: [
                                            new TableCell({
                                              children: [new Paragraph({ children: [new TextRun({ text: item.category, bold: true })] })],
                                              shading: { fill: "EEF2FF" }
                                            }),
                                            new TableCell({
                                              children: item.isStepByStep 
                                                ? item.steps.flatMap((step: any) => [
                                                    new Paragraph({
                                                      children: [
                                                        new TextRun({ text: `${step.step}: ${step.title}`, bold: true, size: 20 })
                                                      ],
                                                      spacing: { before: 100 }
                                                    }),
                                                    new Paragraph({
                                                      text: step.description,
                                                      spacing: { after: 100 }
                                                    })
                                                  ])
                                                : [new Paragraph({ text: item.content })]
                                            })
                                          ]
                                        })
                                      ))
                                    ]
                                  }),
                                  new Paragraph({
                                    text: "",
                                    spacing: { before: 800 }
                                  }),
                                  new Paragraph({
                                    text: "세특 초안 (교사 관점)",
                                    heading: HeadingLevel.HEADING_1,
                                    alignment: AlignmentType.CENTER,
                                    spacing: { after: 400 }
                                  }),
                                  new Paragraph({
                                    children: [
                                      new TextRun({
                                        text: formData.seTeukDraft,
                                        italics: true,
                                        size: 22
                                      })
                                    ],
                                    spacing: { before: 200, after: 200 }
                                  })
                                ]
                              }]
                            });

                            const blob = await Packer.toBlob(doc);
                            saveAs(blob, `탐구결과_${formData.selectedTopic.replace(/\s+/g, '_')}.docx`);
                          } catch (e) {
                            console.error("Failed to generate Word document", e);
                            alert("워드 문서 생성 중 오류가 발생했습니다. 텍스트 파일로 다운로드합니다.");
                            
                            // Fallback to text
                            let planText = "";
                            try {
                              const data = JSON.parse(formData.researchPlan);
                              planText = data.plan.map((item: any) => {
                                if (item.isStepByStep) {
                                  const stepsStr = item.steps.map((s: any) => `${s.step}. ${s.title}: ${s.description}`).join('\n');
                                  return `[${item.category}]\n${stepsStr}`;
                                }
                                return `[${item.category}]\n${item.content}`;
                              }).join('\n\n');
                            } catch (e) {
                              planText = formData.researchPlan;
                            }
                            const content = `[탐구 계획서]\n\n${planText}\n\n--------------------------------\n\n[세특 초안]\n\n${formData.seTeukDraft}`;
                            const blob = new Blob([content], { type: 'text/plain' });
                            saveAs(blob, `탐구결과_${formData.selectedTopic.replace(/\s+/g, '_')}.txt`);
                          }
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                      >
                        <FileText size={20} />
                        Word 문서로 다운로드 (.docx)
                      </button>
                      <button 
                        onClick={() => navigator.clipboard.writeText(formData.seTeukDraft)}
                        className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                      >
                        <ClipboardList size={20} />
                        세특 초안 복사하기
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Phase Footer - Navigation */}
              <div className="bg-slate-50 border-t border-slate-100 px-8 py-6 flex justify-between items-center">
                <button
                  onClick={handleBack}
                  disabled={currentPhase === 1 || isLoading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    currentPhase === 1 || isLoading
                      ? 'text-slate-300 cursor-not-allowed'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <ChevronLeft size={20} />
                  이전 단계
                </button>

                <button
                  onClick={handleNext}
                  disabled={isLoading || (currentPhase === 1 && (!formData.department || !formData.interest)) || (currentPhase === 2 && !formData.selectedTopic) || (currentPhase === 3 && !formData.selectedMotivation) || (currentPhase === 4 && formData.selectedCompetencies.length === 0) || (currentPhase === 5 && !formData.selectedFollowUp)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${
                    isLoading
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                      AI 분석 중...
                    </>
                  ) : (
                    <>
                      {currentPhase === 7 ? '탐구 완료' : '다음 단계로'}
                      <ChevronRight size={20} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Tips / Info Section */}
          {currentPhase < 7 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3">
                <div className="text-amber-500 shrink-0 mt-1">
                  <Lightbulb size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900">진로쌤의 Tip!</h4>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    {TIPS[currentPhase].expert}
                  </p>
                </div>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex gap-3">
                <div className="text-indigo-500 shrink-0 mt-1">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-indigo-900">좋은 세특 작성을 위한 Tip</h4>
                  <p className="text-xs text-indigo-800 mt-1 leading-relaxed">
                    {TIPS[currentPhase].writing}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
