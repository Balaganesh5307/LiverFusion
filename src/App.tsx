import React, { useState } from 'react';
import { NavigationTab, AnalysisRecord, AnalysisResult } from './types';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { StagingGuideModal } from './components/layout/StagingGuideModal';
import { apiService } from './services/api';

// Pages
import { Dashboard } from './pages/Dashboard';
import { ImageAnalysis } from './pages/ImageAnalysis';
import { Results } from './pages/Results';
import { ModelComparison } from './pages/ModelComparison';
import { AnalysisHistory } from './pages/AnalysisHistory';
import { About } from './pages/About';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isStagingGuideOpen, setIsStagingGuideOpen] = useState(false);

  // Analysis session state
  const [records, setRecords] = useState<AnalysisRecord[]>(() => apiService.getLocalHistory());
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [currentUploadedImage, setCurrentUploadedImage] = useState<string | null>(null);

  const handleAnalysisInitiated = (newRecord: AnalysisRecord, resultTemplate: AnalysisResult) => {
    apiService.saveLocalRecord(newRecord);
    setRecords((prev) => [newRecord, ...prev]);
    setCurrentResult(resultTemplate);
    if (newRecord.thumbnailUrl) {
      setCurrentUploadedImage(newRecord.thumbnailUrl);
    }
  };

  const handleSelectRecordForView = (rec: AnalysisRecord) => {
    // Generate viewing result template for this record
    const viewTemplate: AnalysisResult = {
      id: rec.id,
      scanId: rec.id,
      timestamp: rec.createdAt,
      fileName: rec.fileName,
      fileSizeFormatted: rec.fileSize,
      imageDimensions: '768 × 576 px',
      modality: rec.modality,
      model: rec.model,
      predictedStage: rec.predictedStage || 'F2',
      top1Confidence: rec.confidence || 0.88,
      isDemonstrationData: true,
      status: 'completed',
      confidenceScores: [
        { stage: 'F0', label: 'Stage F0 (Normal)', probability: 0.03 },
        { stage: 'F1', label: 'Stage F1 (Mild)', probability: 0.07 },
        { stage: 'F2', label: 'Stage F2 (Moderate)', probability: rec.predictedStage === 'F2' ? 0.88 : 0.04, isTopChoice: rec.predictedStage === 'F2' },
        { stage: 'F3', label: 'Stage F3 (Severe)', probability: rec.predictedStage === 'F3' ? 0.82 : 0.04, isTopChoice: rec.predictedStage === 'F3' },
        { stage: 'F4', label: 'Stage F4 (Cirrhosis)', probability: rec.predictedStage === 'F4' ? 0.96 : 0.02, isTopChoice: rec.predictedStage === 'F4' },
      ],
      explainability: {
        method: 'Grad-CAM',
        heatmapAvailable: true,
        description: `Simulated feature extraction for ${rec.fileName}`,
        focusAreas: ['Parenchymal coarseness', 'Capsular contour', 'Periportal sheaths'],
      },
    };

    setCurrentResult(viewTemplate);
    if (rec.thumbnailUrl) {
      setCurrentUploadedImage(rec.thumbnailUrl);
    }
    setCurrentTab('results');
  };

  const handleDeleteRecord = (id: string) => {
    const updated = apiService.deleteLocalRecord(id);
    setRecords(updated);
  };

  const handleResetDemoRecords = () => {
    localStorage.removeItem('liverfusion_demo_history');
    setRecords(apiService.getLocalHistory());
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-teal-100 selection:text-teal-900">
      {/* Top Clinical Header */}
      <Header
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onOpenStagingGuide={() => setIsStagingGuideOpen(true)}
      />

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <Dashboard
              onNavigateTab={setCurrentTab}
              recentRecords={records}
              onSelectRecord={handleSelectRecordForView}
              onOpenStagingGuide={() => setIsStagingGuideOpen(true)}
            />
          )}

          {currentTab === 'analyze' && (
            <ImageAnalysis
              onAnalysisInitiated={handleAnalysisInitiated}
              onNavigateToResults={() => setCurrentTab('results')}
            />
          )}

          {currentTab === 'results' && (
            <Results
              currentResult={currentResult}
              uploadedImageUrl={currentUploadedImage}
              onNavigateTab={setCurrentTab}
              onOpenStagingGuide={() => setIsStagingGuideOpen(true)}
            />
          )}

          {currentTab === 'models' && (
            <ModelComparison />
          )}

          {currentTab === 'history' && (
            <AnalysisHistory
              records={records}
              onSelectRecord={handleSelectRecordForView}
              onDeleteRecord={handleDeleteRecord}
              onResetDemoRecords={handleResetDemoRecords}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'about' && (
            <About />
          )}
        </main>
      </div>

      {/* Global Clinical Footer */}
      <Footer />

      {/* Global METAVIR Staging Guide Modal */}
      <StagingGuideModal
        isOpen={isStagingGuideOpen}
        onClose={() => setIsStagingGuideOpen(false)}
      />
    </div>
  );
};
export default App;
