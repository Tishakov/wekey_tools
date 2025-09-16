import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import TransliterationTool from './pages/TransliterationTool';
import UtmGeneratorTool from './pages/UtmGeneratorTool';
import CharCounterTool from './pages/CharCounterTool';
import TextOptimizerTool from './pages/TextOptimizerTool';
import DuplicateFinderTool from './pages/DuplicateFinderTool';
import DuplicateRemovalTool from './pages/DuplicateRemovalTool';
import TextToHtmlTool from './pages/TextToHtmlTool';
import SynonymGeneratorTool from './pages/SynonymGeneratorTool';
import PasswordGeneratorTool from './pages/PasswordGeneratorTool';
import TextGeneratorTool from './pages/TextGeneratorTool';
import NumberGeneratorTool from './pages/NumberGeneratorTool';
import AddSymbolTool from './pages/AddSymbolTool';
import CaseChangerTool from './pages/CaseChangerTool';
import WordMixerTool from './pages/WordMixerTool';
import FindReplaceTool from './pages/FindReplaceTool';
import MinusWordsTool from './pages/MinusWordsTool';
import SpacesToParagraphsTool from './pages/SpacesToParagraphsTool';
import TextSortingTool from './pages/TextSortingTool';
import EmptyLinesRemovalTool from './pages/EmptyLinesRemovalTool';
import EmojiTool from './pages/EmojiTool';
import AnalyticsTool from './pages/AnalyticsTool';
import './styles/tool-pages.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/transliteration" element={<TransliterationTool />} />
          <Route path="/utm-generator" element={<UtmGeneratorTool />} />
          <Route path="/char-counter" element={<CharCounterTool />} />
          <Route path="/text-optimizer" element={<TextOptimizerTool />} />
          <Route path="/duplicate-finder" element={<DuplicateFinderTool />} />
          <Route path="/duplicate-removal" element={<DuplicateRemovalTool />} />
          <Route path="/text-to-html" element={<TextToHtmlTool />} />
          <Route path="/synonym-generator" element={<SynonymGeneratorTool />} />
          <Route path="/password-generator" element={<PasswordGeneratorTool />} />
          <Route path="/text-generator" element={<TextGeneratorTool />} />
          <Route path="/number-generator" element={<NumberGeneratorTool />} />
          <Route path="/add-symbol" element={<AddSymbolTool />} />
          <Route path="/case-changer" element={<CaseChangerTool />} />
          <Route path="/word-mixer" element={<WordMixerTool />} />
          <Route path="/find-replace" element={<FindReplaceTool />} />
          <Route path="/minus-words" element={<MinusWordsTool />} />
          <Route path="/spaces-to-paragraphs" element={<SpacesToParagraphsTool />} />
          <Route path="/text-sorting" element={<TextSortingTool />} />
          <Route path="/remove-empty-lines" element={<EmptyLinesRemovalTool />} />
          <Route path="/emoji" element={<EmojiTool />} />
          <Route path="/cross-analytics" element={<AnalyticsTool />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
