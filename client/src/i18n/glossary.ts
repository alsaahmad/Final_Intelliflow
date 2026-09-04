export const GOVERNMENT_GLOSSARY_HI: Record<string, string> = {
  "PROTOTYPE SIMULATED ACTION — NO REAL SIGNAL CONTROL": "प्रारूप अनुकरण कार्रवाई — कोई वास्तविक सिग्नल नियंत्रण नहीं",
  "TRAFFIC_POLICE": "यातायात पुलिस",
  "CITY_OPERATIONS": "शहर संचालन",
  "COMMAND_CENTER": "कमांड सेंटर",
  "EMERGENCY GREEN CORRIDOR": "आपातकालीन ग्रीन कॉरिडोर",
  "SYSTEM AUDIT LOG": "सिस्टम ऑडिट लॉग",
  "INCREASE_GREEN_TIME": "ग्रीन टाइम बढ़ाएं",
  "DECREASE_GREEN_TIME": "ग्रीन टाइम घटाएं",
  "MAINTAIN_TIMING": "वर्तमान समय बनाए रखें",
  "View Only — Execution Restricted to Traffic Police": "केवल देखें — निष्पादन केवल यातायात पुलिस के लिए सीमित",
  "CRITICAL": "गंभीर",
  "MODERATE": "मध्यम",
  "HIGH": "उच्च",
  "LOW": "कम",
  "OPTIMAL": "इष्टतम",
  "INCREASING": "बढ़ रहा है",
  "DECREASING": "घट रहा है",
  "STABLE": "स्थिर",
  "RESTRICTIVE": "सीमित",
  "BALANCED": "संतुलित",
};

export const translateGlossaryTerm = (term: string, language: string): string => {
  if (language === 'hi' && GOVERNMENT_GLOSSARY_HI[term]) {
    return GOVERNMENT_GLOSSARY_HI[term];
  }
  return term;
};
