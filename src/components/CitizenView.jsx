import React, { useState } from 'react';
import {
  ShieldAlert,
  PhoneCall,
  MapPin,
  AlertTriangle,
  Languages,
  PlusCircle,
  Clock,
  Radio,
  WifiOff,
  Wifi,
  ExternalLink,
  LifeBuoy
} from 'lucide-react';
import { NE_STATES_GEO } from '../data/neSpatialData';

export default function CitizenView({
  selectedState = 'Assam',
  onSelectState = () => {},
  onOpenReportModal = () => {},
  incidentReports = [],
  isOnline = true,
  latestAiAlert = null,
  offlineReportsCount = 0,
}) {
  const [selectedLanguage, setSelectedLanguage] = useState('english');

  const stateData = NE_STATES_GEO[selectedState] || NE_STATES_GEO['Assam'];

  // Calculate local citizen safety score (100 is fully safe, 0 is extreme imminent danger)
  const riskToScore = {
    LOW: 88,
    MODERATE: 68,
    HIGH: 44,
    CRITICAL: 22,
  };

  const safetyScore = riskToScore[stateData.overallRisk] || 50;

  // Localized emergency advisory text templates
  const localizedAdvisories = {
    english: {
      alertTitle: `Current Hazard Advisory: ${stateData.overallRisk} Risk in ${stateData.name}`,
      advisoryBody: `Heavy precipitation and localized saturation observed in ${stateData.name}. Hill cuts and river basins are experiencing accelerated runoff. Citizens in low-lying riparian areas and steep slope zones are urged to stay on high alert.`,
      evacuationAction: 'Move to designated district high-ground shelter if river stage crosses red markers or hillside crack sounds occur.',
      helplineLabel: 'Emergency Control Room',
    },
    assamese: {
      alertTitle: `বৰ্তমান সতৰ্কবাণী: ${stateData.name}ত ${stateData.overallRisk === 'CRITICAL' ? 'চৰম সংকটজনক' : stateData.overallRisk === 'HIGH' ? 'উচ্চ বিপদজনক' : 'মধ্যমীয়া'} স্থিতি`,
      advisoryBody: `${stateData.name}ৰ কেইবাটাও অঞ্চলত প্ৰৱল বৰষুণৰ ফলত বানপানী আৰু পাহাৰীয়া খহনীয়াৰ সৃষ্টি হৈছে। নৈপৰীয়া আৰু পাহাৰৰ নামনিৰ বাসিন্দাসকলক সতৰ্ক থাকিবলৈ কোৱা হৈছে।`,
      evacuationAction: 'নৈৰ পানী বিপদসীমা অতিক্ৰম কৰিলে বা পাহাৰ খহাৰ লক্ষণ দেখিলে শীঘ্ৰে ওখ আশ্ৰয় শিবিৰলৈ যাওক।',
      helplineLabel: 'জিলা জৰুৰীকালীন সাহায্য কেন্দ্ৰ',
    },
    manipuri: {
      alertTitle: `হৌজিক্কী চেকশিনৱা: ${stateData.name}দা ${stateData.overallRisk} রিক্স`,
      advisoryBody: `নোং কন্নীংনা চুবা অমসুং তুরেলগী ঈচিং খোংজেল য়াংনা ৱাংখৎলকপনা মরম ওইদুনা লমদমসিদা ঈচিং ইচাও অমসুং চিংশিৎ তূম্বা থোকপগী অকনবা খুদোংথীবা লৈরে।`,
      evacuationAction: 'তুরেল মপালগী অমসুং চিংগী মখাদা লৈবা মীওইশিং খুদোংথীবা থোকপা য়াবা মফমদগী থোরক্তুনা কান্নবা য়াবা মফমদা লৈবীয়ু।',
      helplineLabel: 'ইমর্জেন্সী কন্ত্রোল রূম',
    },
    khasi: {
      alertTitle: `Jingmaham ba mynta: Ka jingma kaba ${stateData.overallRisk} ha ${stateData.name}`,
      advisoryBody: `Ka jingshlei um bad ka jingtwah khyndew ka lah ban jia namar ka jingther u slap jur. Ki nongshong shnong kiba don ha ki rud wah bad ki them ki dei ban husiar.`,
      evacuationAction: 'Kiew sha ki jaka kiba shngain lada ka um ka kiew ne ka khyndew ka sdang ban twah.',
      helplineLabel: 'Ka Control Room jong ka District',
    },
    mizo: {
      alertTitle: `Hlauhawm dinhmun: ${stateData.name}-ah ${stateData.overallRisk} a awm mek`,
      advisoryBody: `Ruah sur nasa avangin tui lian leh lei tawlh a thleng thei a. Luikam leh tlang pang a khawsa te fimkhur tur a ngen in ni.`,
      evacuationAction: 'Tui a lian a, lei a tawlh theih rualin hmun him lamah in sawn nghal rawh u.',
      helplineLabel: 'Emergency Helpline',
    },
    bengali: {
      alertTitle: `জরুরি সতর্কতা: ${stateData.name}-এ ${stateData.overallRisk} ঝুঁকি`,
      advisoryBody: `টানা অতিভারী বৃষ্টি ও পাহাড়ি ঢলে নদী সমূহে আকস্মিক জলস্তর বৃদ্ধি এবং ভূমিধসের প্রবল আশঙ্কা দেখা দিয়েছে। নদী তীরবর্তী ও পাহাড়ি অধিবাসীদের চরম সতর্ক থাকতে নির্দেশ দেওয়া হচ্ছে।`,
      evacuationAction: 'জলস্তর বিপদসীমা অতিক্রম করলে অবিলম্বে নিকটস্থ পাকা বহুমুখী আশ্রয়কেন্দ্রে আশ্রয় নিন।',
      helplineLabel: 'জেলা বিপর্যয় মোকাবিলা সেল',
    },
  };

  const currentAdvisory = localizedAdvisories[selectedLanguage] || localizedAdvisories.english;

  return (
    <div className="space-y-4">
      {/* Offline/Online Network Banner */}
      <div
        className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-xs backdrop-blur-md ${
          isOnline
            ? 'bg-slate-900/50 border-white/10 text-slate-300'
            : 'bg-red-950/60 border-red-500/80 text-red-200 shadow-lg shadow-red-950/50'
        }`}
      >
        <div className="flex items-center gap-2">
          {isOnline ? (
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold font-mono">
              <Wifi className="w-4 h-4" />
              Connected to NE Emergency Network
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-red-400 font-bold font-mono">
              <WifiOff className="w-4 h-4" />
              Offline Mode Active (Low Bandwidth PWA)
            </span>
          )}
          <span className="text-slate-600">•</span>
          <span className="text-slate-400 font-mono text-[11px]">
            {offlineReportsCount > 0
              ? `${offlineReportsCount} incident(s) pending sync in IndexedDB`
              : 'Local IndexedDB synchronized'}
          </span>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center gap-1 bg-black/60 p-1 rounded-lg border border-white/10">
          <Languages className="w-3.5 h-3.5 text-red-400 ml-1" />
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none pr-1 cursor-pointer"
          >
            <option value="english" className="bg-slate-900">English</option>
            <option value="assamese" className="bg-slate-900">অসমীয়া (Assamese)</option>
            <option value="manipuri" className="bg-slate-900">মৈতৈলোন্ (Manipuri)</option>
            <option value="khasi" className="bg-slate-900">Khasi (Meghalaya)</option>
            <option value="mizo" className="bg-slate-900">Mizo (Mizoram)</option>
            <option value="bengali" className="bg-slate-900">বাংলা (Bengali)</option>
          </select>
        </div>
      </div>

      {/* Hero Safety Score & Emergency Action Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Safety Score Card */}
        <div className="md:col-span-4 bg-slate-900/50 border border-white/10 rounded-xl p-5 shadow-2xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
              <span className="font-bold uppercase tracking-widest text-[10px]">Local Safety Index</span>
              <span className="text-slate-300 font-bold">{stateData.name} Sector</span>
            </div>

            <div className="flex items-baseline gap-3 my-2">
              <span
                className={`text-5xl font-black font-mono tracking-tight ${
                  safetyScore < 30
                    ? 'text-red-500'
                    : safetyScore < 60
                    ? 'text-orange-400'
                    : 'text-emerald-400'
                }`}
              >
                {safetyScore}
              </span>
              <span className="text-xs text-slate-400 font-mono">/ 100 Safety Score</span>
            </div>

            <div className="w-full bg-black/60 h-2 rounded-full overflow-hidden my-2 border border-white/5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  safetyScore < 30
                    ? 'bg-red-500 w-[22%]'
                    : safetyScore < 60
                    ? 'bg-orange-400 w-[44%]'
                    : 'bg-emerald-400 w-[88%]'
                }`}
              />
            </div>

            <p className="text-xs text-slate-300 mt-2 font-mono">
              Status:{' '}
              <strong
                className={
                  stateData.overallRisk === 'CRITICAL'
                    ? 'text-red-500'
                    : stateData.overallRisk === 'HIGH'
                    ? 'text-orange-400'
                    : 'text-emerald-400'
                }
              >
                {stateData.overallRisk} HAZARD THREAT
              </strong>
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 text-xs text-slate-400 flex justify-between items-center font-mono">
            <span>Vulnerability: {stateData.vulnerabilityIndex}/10</span>
            <span className="text-emerald-400">● Sensors Live</span>
          </div>
        </div>

        {/* Plain-Language Localized Advisory */}
        <div className="md:col-span-8 bg-black/40 border border-white/10 rounded-xl p-5 shadow-2xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                {currentAdvisory.alertTitle}
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800">
                OFFICIAL SDMA BULLETIN
              </span>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-sans mt-1 bg-slate-900/80 p-3.5 rounded-xl border border-white/10">
              {currentAdvisory.advisoryBody}
            </p>

            <div className="mt-2.5 flex items-start gap-2 text-xs text-red-300 bg-red-950/40 p-2.5 rounded-lg border border-red-600/40">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{currentAdvisory.evacuationAction}</span>
            </div>
          </div>

          {/* Quick Action Button: Report Incident */}
          <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              <span>
                {currentAdvisory.helplineLabel}:{' '}
                <strong className="text-white font-mono text-sm">{stateData.helpline}</strong>
              </span>
            </div>

            <button
              onClick={onOpenReportModal}
              className="py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-red-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Report Landslide / Flood / Road Cut
            </button>
          </div>
        </div>
      </div>

      {/* Citizen Disaster Preparedness & Live Reports Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* State Quick Selector */}
        <div className="bg-black/40 border border-white/10 rounded-xl p-4 shadow-xl backdrop-blur-md">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
            <span>North-East State Sectors</span>
            <span className="text-[10px] text-slate-500 font-mono">8 States</span>
          </h4>

          <div className="grid grid-cols-2 gap-2">
            {Object.keys(NE_STATES_GEO).map((stName) => {
              const info = NE_STATES_GEO[stName];
              const isSelected = selectedState === stName;
              return (
                <button
                  key={stName}
                  onClick={() => onSelectState(stName)}
                  className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-red-950/60 border-red-500 text-white shadow-md shadow-red-950/40'
                      : 'bg-slate-900/60 border-white/5 text-slate-300 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold font-mono text-xs">{info.code}</span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        info.overallRisk === 'CRITICAL'
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : info.overallRisk === 'HIGH'
                          ? 'bg-orange-950 text-orange-300 border border-orange-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {info.overallRisk}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-200 truncate mt-1">{info.name}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Community Incident Reports */}
        <div className="lg:col-span-2 bg-black/40 border border-white/10 rounded-xl p-4 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-red-500" />
                Verified Community Hazard Reports ({stateData.name} Sector)
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">IndexedDB Active</span>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {incidentReports
                .filter((r) => r.state === selectedState || selectedState === 'All')
                .slice(0, 4)
                .map((report) => (
                  <div
                    key={report.id}
                    className={`p-3 rounded transition-colors ${
                      report.hazardType === 'FLASH_FLOOD' || report.severity === 'CRITICAL'
                        ? 'bg-red-950/30 border-l-2 border-red-600'
                        : 'bg-orange-950/30 border-l-2 border-orange-500'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold font-mono px-1.5 py-0.2 rounded ${
                              report.hazardType === 'LANDSLIDE'
                                ? 'bg-orange-950 text-orange-400 border border-orange-800'
                                : report.hazardType === 'ROAD_BLOCKAGE'
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : 'bg-red-950 text-red-400 border border-red-800'
                            }`}
                          >
                            {report.hazardType.replace('_', ' ')}
                          </span>
                          <h5 className="text-xs font-bold text-white truncate max-w-[280px]">
                            {report.title}
                          </h5>
                        </div>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          {report.locationName}, {report.district}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 font-mono block border border-white/5">
                          {report.status}
                        </span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-1 justify-end font-mono">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

              {incidentReports.filter((r) => r.state === selectedState).length === 0 && (
                <div className="p-6 text-center text-xs text-slate-500 font-mono">
                  No active incidents reported in {stateData.name} sector yet.
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Low-bandwidth cached offline storage</span>
            <button
              onClick={onOpenReportModal}
              className="text-red-400 hover:text-red-300 font-semibold text-xs flex items-center gap-1 cursor-pointer"
            >
              Submit Geotagged Incident &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
