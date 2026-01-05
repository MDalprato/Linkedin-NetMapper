
import React, { useState, useCallback } from 'react';
import { LinkedInConnection, TreeNode, NetworkSummary } from './types';
import TreeVisualizer from './components/TreeVisualizer';
import StatsDashboard from './components/StatsDashboard';
import { getNetworkInsights } from './services/geminiService';

const App: React.FC = () => {
  const [connections, setConnections] = useState<LinkedInConnection[]>([]);
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const [summary, setSummary] = useState<NetworkSummary | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);

  const parseCSV = (text: string): LinkedInConnection[] => {
    const rows = text.split('\n').filter(row => row.trim() !== '');
    // LinkedIn CSV often has a header at row 4 or something, but standard is row 1
    // We'll look for a row that starts with "First Name"
    const headerIndex = rows.findIndex(r => r.includes('First Name'));
    if (headerIndex === -1) return [];

    const headers = rows[headerIndex].split(',').map(h => h.trim().replace(/"/g, ''));
    const dataRows = rows.slice(headerIndex + 1);

    return dataRows.map(row => {
      // Robust split for quoted values containing commas
      const values = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
      const cleanValues = values.map(v => v.trim().replace(/^"|"$/g, ''));
      
      const connection: any = {};
      headers.forEach((header, i) => {
        const key = header.toLowerCase().replace(/\s/g, '');
        if (key.includes('firstname')) connection.firstName = cleanValues[i];
        if (key.includes('lastname')) connection.lastName = cleanValues[i];
        if (key.includes('company')) connection.company = cleanValues[i];
        if (key.includes('position') || key.includes('occupation')) connection.position = cleanValues[i];
        if (key.includes('connectedon')) connection.connectedOn = cleanValues[i];
        if (key.includes('url')) connection.url = cleanValues[i];
        if (key.includes('email')) connection.email = cleanValues[i];
      });
      return connection as LinkedInConnection;
    }).filter(c => c.company);
  };

  const processData = useCallback(async (connections: LinkedInConnection[]) => {
    setIsProcessing(true);
    
    // Build Tree
    const companies: Record<string, LinkedInConnection[]> = {};
    connections.forEach(c => {
      if (!companies[c.company]) companies[c.company] = [];
      companies[c.company].push(c);
    });

    const root: TreeNode = {
      name: "My Network",
      type: 'root',
      children: Object.entries(companies)
        .sort(([, a], [, b]) => b.length - a.length)
        .slice(0, 50) // Limit to top 50 for performance
        .map(([name, group]) => ({
          name,
          type: 'company' as const,
          children: group.map(conn => ({
            name: `${conn.firstName} ${conn.lastName}`,
            type: 'contact' as const,
            info: conn
          }))
        }))
    };

    // Build Summary
    const stats: NetworkSummary = {
      totalConnections: connections.length,
      totalCompanies: Object.keys(companies).length,
      topCompanies: Object.entries(companies)
        .map(([name, list]) => ({ name, count: list.length }))
        .sort((a, b) => b.count - a.count)
    };

    setTreeData(root);
    setSummary(stats);
    setIsProcessing(false);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      setConnections(parsed);
      processData(parsed);
    };
    reader.readAsText(file);
  };

  const generateAIInsights = async () => {
    if (connections.length === 0) return;
    setIsGeneratingInsights(true);
    const insights = await getNetworkInsights(connections);
    setAiInsights(insights);
    setIsGeneratingInsights(false);
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">NetMapper</h1>
          </div>
          <div className="flex items-center gap-4">
             {connections.length > 0 && (
               <button 
                onClick={() => { setConnections([]); setTreeData(null); setSummary(null); setAiInsights(''); }}
                className="text-sm font-medium text-gray-500 hover:text-red-500 transition-colors"
               >
                 Clear Data
               </button>
             )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        {!treeData ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-2xl mx-auto">
            <div className="bg-blue-50 p-8 rounded-full mb-8">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Visualize Your Career Network</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Upload your LinkedIn <span className="font-mono text-sm bg-gray-100 px-1 rounded">Connections.csv</span> file to create an interactive 
              company tree and get professional insights using Gemini AI.
            </p>
            
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 w-full mb-8">
              <label className="flex flex-col items-center gap-4 cursor-pointer">
                <div className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-200">
                  Select Connections.csv
                </div>
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                <span className="text-xs text-gray-400">Your data is processed locally and never stored.</span>
              </label>
            </div>

            <div className="text-left bg-white p-6 rounded-xl border border-gray-100 w-full">
              <h3 className="font-bold text-gray-800 mb-2">How to get your file:</h3>
              <ol className="text-sm text-gray-600 space-y-2 list-decimal ml-5">
                <li>Go to <a href="https://www.linkedin.com/psettings/member-data" target="_blank" className="text-blue-600 underline">LinkedIn Data Privacy</a>.</li>
                <li>Select "Get a copy of your data" and check "Connections".</li>
                <li>Request archive. You'll receive a link to download the CSV in minutes.</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row gap-4 items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Your Professional Ecosystem</h2>
                <p className="text-gray-500">Mapping {connections.length} nodes across {summary?.totalCompanies} companies.</p>
              </div>
              <button 
                onClick={generateAIInsights}
                disabled={isGeneratingInsights}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                {isGeneratingInsights ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Thinking...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                    </svg>
                    Generate AI Insights
                  </>
                )}
              </button>
            </div>

            {summary && <StatsDashboard summary={summary} />}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800">Connection Tree</h3>
                    <div className="flex gap-2">
                       <span className="flex items-center gap-1 text-[10px] text-gray-500"><div className="w-2 h-2 rounded-full bg-blue-600"></div> Root</span>
                       <span className="flex items-center gap-1 text-[10px] text-gray-500"><div className="w-2 h-2 rounded-full bg-blue-400"></div> Company</span>
                       <span className="flex items-center gap-1 text-[10px] text-gray-500"><div className="w-2 h-2 rounded-full bg-gray-200 border border-gray-300"></div> Person</span>
                    </div>
                  </div>
                  <TreeVisualizer data={treeData} onNodeClick={setSelectedNode} />
                </div>
              </div>

              <div className="space-y-6">
                {/* AI Insights Card */}
                {aiInsights && (
                  <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl shadow-sm border border-indigo-100 p-6">
                    <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Network Intelligence
                    </h3>
                    <div className="prose prose-sm text-gray-700 overflow-y-auto max-h-[400px] no-scrollbar">
                      {aiInsights.split('\n').map((line, i) => (
                        <p key={i} className="mb-2">{line}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selection Detail Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                  <h3 className="font-bold text-gray-800 mb-4">Node Details</h3>
                  {selectedNode ? (
                    <div className="animate-in slide-in-from-right-2">
                      {selectedNode.type === 'contact' && selectedNode.info ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                              {selectedNode.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 leading-tight">{selectedNode.name}</p>
                              <p className="text-sm text-gray-500">{selectedNode.info.position}</p>
                            </div>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Company:</span>
                              <span className="font-medium text-gray-700">{selectedNode.info.company}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Connected:</span>
                              <span className="font-medium text-gray-700">{selectedNode.info.connectedOn}</span>
                            </div>
                            {selectedNode.info.url && (
                              <a href={selectedNode.info.url} target="_blank" className="block text-center mt-4 text-blue-600 font-bold border border-blue-100 rounded-lg py-2 hover:bg-blue-50 transition-colors">
                                View Profile
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="font-bold text-gray-900">{selectedNode.name}</p>
                          <p className="text-sm text-gray-500 mt-1 capitalize">{selectedNode.type}</p>
                          <p className="text-xs text-gray-400 mt-4 italic">
                            {selectedNode.children?.length || 0} immediate connections mapped to this node.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                      </svg>
                      <p>Click a node in the tree to see details</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button for smaller screens (example) */}
      <footer className="fixed bottom-0 w-full bg-white/80 backdrop-blur-md border-t border-gray-100 py-3 block md:hidden">
        <div className="flex justify-center">
            {treeData && (
              <label className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold shadow-lg">
                Upload New
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              </label>
            )}
        </div>
      </footer>
    </div>
  );
};

export default App;
