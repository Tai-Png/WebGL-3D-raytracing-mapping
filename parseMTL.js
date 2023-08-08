function parseMTL(text) {
    let materialsData = {};
    let currentMaterial = '';

    const keywords = {
        newmtl (parts, unparsedArgs) {
            currentMaterial = unparsedArgs;
            materialsData[currentMaterial] = {};
        },
        Ns (parts, unparsedArgs) {

        },
        Ka (parts, unparsedArgs) {

        },
        Ks (parts, unparsedArgs) {

        },
        Ke (parts, unparsedArgs) {

        },
        Ni(parts, unparsedArgs) {

        },
        Kd(parts, unparsedArgs) {
          materialsData[currentMaterial]['d'] = parts.map(parseFloat);
        },
        d (parts, unparsedArgs) {

        },
        illum (parts, unparsedArgs) {

        },
        map_Kd (parts, unparsedArgs) {  
            materialsData[currentMaterial]['tex'] = unparsedArgs;
        },
        map_Bump (parts, unparsedArgs) {

        }
    };
  
    const keywordRE = /(\w*)(?: )*(.*)/;
    const lines = text.split('\n');
    for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
      const line = lines[lineNo].trim();
      if (line === '' || line.startsWith('#')) {
        continue;
      }
      const m = keywordRE.exec(line);
      if (!m) {
        continue;
      }
      const [, keyword, unparsedArgs] = m;
      const parts = line.split(/\s+/).slice(1);
      const handler = keywords[keyword];
      if (!handler) {
        console.warn('unhandled keyword in mtl:', keyword);
        continue;
      }
      handler(parts, unparsedArgs);
    }
  
    // remove any arrays that have no entries.

    return {
        materialsData
    };
  }