import React, { useState, useEffect } from 'react';
import './Txt.css';

const Txt = () => {
  const [vlans, setVlans] = useState([
    { id: '10', name: 'Admin' },
    { id: '20', name: 'Operator' },
    { id: '30', name: 'Employee' },
    { id: '40', name: 'Cleaning' },
    { id: '50', name: 'Development' },
    { id: '99', name: 'NATIVE_TRUNK' }
  ]);

  const [switches, setSwitches] = useState([
    { 
      id: 1, 
      name: 'Switch_1', 
      vlanInterfaces: { '10': 'fa0/1', '99': '' }, 
      trunkPorts: ['gi0/1'], 
      selectedVlanIds: ['10', '99'],
      isCore: false,
      pcIps: [{ pcName: '', ip: '', vlan: '', description: '' }]
    },
    { 
      id: 2, 
      name: 'Switch_2', 
      vlanInterfaces: { '20': 'fa0/1', '99': '' }, 
      trunkPorts: ['gi0/1'], 
      selectedVlanIds: ['20', '99'],
      isCore: false,
      pcIps: [{ pcName: '', ip: '', vlan: '', description: '' }]
    }
  ]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [switchConfigs, setSwitchConfigs] = useState([]);
  const [pcIps, setPcIps] = useState('');

  useEffect(() => {
    generateAll();
  }, [switches, vlans]);

  const generateAll = () => {
    const configs = switches.map((sw) => {
      let text = `enable\nconfigure terminal\n!\nhostname ${sw.name}\n!\n`;
      
      // Core switches get ALL VLANs, regular switches get only selected ones
      const activeVlans = sw.isCore ? vlans : vlans.filter(v => sw.selectedVlanIds?.includes(v.id));
      
      activeVlans.forEach(vlan => {
        if (vlan.id) {
          text += `vlan ${vlan.id}\n`;
          if (vlan.name) text += ` name ${vlan.name}\n`;
        }
      });
      text += 'exit\n!\n';

      // Trunk Ports
      if (sw.trunkPorts && sw.trunkPorts.length > 0) {
        sw.trunkPorts.forEach((trunkPort, idx) => {
          if (trunkPort && trunkPort.trim()) {
            text += `! Trunking configuration ${idx + 1}\ninterface ${trunkPort}\n`;
            text += ` switchport mode trunk\n`;
            text += ` switchport trunk native vlan 99\n`;
            if (sw.isCore) {
              text += ` ! Core switch - allows all VLANs\n`;
              const vlanList = vlans.filter(v => v.id).map(v => v.id).join(',');
              if (vlanList) text += ` switchport trunk allowed vlan ${vlanList}\n`;
            }
            text += '!\n';
          }
        });
      }

      // Access Ports - now from vlanInterfaces
      if (sw.vlanInterfaces) {
        Object.entries(sw.vlanInterfaces).forEach(([vlanId, interfaceStr]) => {
          if (interfaceStr && interfaceStr.trim()) {
            const isRange = interfaceStr.includes('-');
            text += `interface ${isRange ? 'range ' : ''}${interfaceStr}\n`;
            text += ` switchport mode access\n`;
            text += ` switchport access vlan ${vlanId}\n`;
            text += '!\n';
          }
        });
      }

      text += 'end\nwrite memory\n';
      return { name: sw.name, cli: text, isCore: sw.isCore };
    });

    setSwitchConfigs(configs);

    // PC IPs for all switches
    let fullPcIps = '';
    
    switches.forEach(sw => {
      fullPcIps += `! === ${sw.name} ===\n`;
      
      // Auto-generated IPs from switch interfaces
      if (sw.vlanInterfaces) {
        Object.entries(sw.vlanInterfaces).forEach(([vlanId, interfaceStr]) => {
          if (interfaceStr && interfaceStr.trim()) {
            const ports = parsePorts(interfaceStr);
            ports.forEach(port => {
              const portNum = port.split('/').pop();
              fullPcIps += `${port}: 192.168.${vlanId}.${portNum} (auto)\n`;
            });
          }
        });
      }
      
      // Manual PC IPs for this switch
      if (sw.pcIps && sw.pcIps.some(pc => pc.pcName || pc.ip)) {
        sw.pcIps.forEach(pc => {
          if (pc.pcName && pc.ip) {
            const vlanInfo = pc.vlan ? ` (VLAN ${pc.vlan})` : '';
            const descInfo = pc.description ? ` - ${pc.description}` : '';
            fullPcIps += `${pc.pcName}: ${pc.ip}${vlanInfo}${descInfo}\n`;
          }
        });
      }
      
      fullPcIps += '\n';
    });
    
    setPcIps(fullPcIps);
  };

  const parsePorts = (rangeStr) => {
    const ports = [];
    try {
      if (rangeStr.includes('-')) {
        const rangePart = rangeStr.includes(' ') ? rangeStr.split(' ').pop() : rangeStr;
        const [base, end] = rangePart.split('-');
        const baseNum = parseInt(base.split('/').pop());
        const endNum = parseInt(end);
        const prefix = base.substring(0, base.lastIndexOf('/') + 1);
        for (let i = baseNum; i <= endNum; i++) ports.push(`${prefix}${i}`);
      } else {
        ports.push(rangeStr);
      }
    } catch (e) { console.error(e); }
    return ports;
  };

  const addSwitch = () => {
    const newId = switches.length + 1;
    setSwitches([...switches, { 
      id: newId, 
      name: `Switch_${newId}`, 
      vlanInterfaces: {}, 
      trunkPorts: ['gi0/1'], 
      selectedVlanIds: [], 
      isCore: false,
      pcIps: [{ pcName: '', ip: '', vlan: '', description: '' }]
    }]);
    setActiveIndex(switches.length);
  };

  const addMultipleSwitches = (count) => {
    const numCount = parseInt(count);
    if (isNaN(numCount) || numCount <= 0) return;
    
    const newSwitches = [];
    for (let i = 0; i < numCount; i++) {
      const newId = switches.length + i + 1;
      newSwitches.push({
        id: newId,
        name: `Switch_${newId}`,
        vlanInterfaces: {},
        trunkPorts: ['gi0/1'],
        selectedVlanIds: [],
        isCore: false,
        pcIps: [{ pcName: '', ip: '', vlan: '', description: '' }]
      });
    }
    setSwitches([...switches, ...newSwitches]);
  };

  const removeSwitch = (idx) => {
    if (switches.length <= 1) return;
    const newSwitches = switches.filter((_, i) => i !== idx);
    setSwitches(newSwitches);
    setActiveIndex(0);
  };

  const updateSwitchVlans = (swIdx, vlanId) => {
    const newSwitches = [...switches];
    const selected = newSwitches[swIdx].selectedVlanIds || [];
    if (selected.includes(vlanId)) {
      newSwitches[swIdx].selectedVlanIds = selected.filter(id => id !== vlanId);
      // Remove interface assignment for this VLAN
      if (newSwitches[swIdx].vlanInterfaces) {
        delete newSwitches[swIdx].vlanInterfaces[vlanId];
      }
    } else {
      newSwitches[swIdx].selectedVlanIds = [...selected, vlanId];
      // Initialize empty interface for this VLAN
      if (!newSwitches[swIdx].vlanInterfaces) newSwitches[swIdx].vlanInterfaces = {};
      newSwitches[swIdx].vlanInterfaces[vlanId] = '';
    }
    setSwitches(newSwitches);
  };

  const updateSwitch = (idx, field, value) => {
    const newSwitches = [...switches];
    newSwitches[idx][field] = value;
    setSwitches(newSwitches);
  };

  const updateVlanInterface = (swIdx, vlanId, interfaceStr) => {
    const newSwitches = [...switches];
    if (!newSwitches[swIdx].vlanInterfaces) newSwitches[swIdx].vlanInterfaces = {};
    newSwitches[swIdx].vlanInterfaces[vlanId] = interfaceStr;
    setSwitches(newSwitches);
  };

  const updatePcIp = (swIdx, pcIdx, field, value) => {
    const newSwitches = [...switches];
    if (!newSwitches[swIdx].pcIps) newSwitches[swIdx].pcIps = [];
    newSwitches[swIdx].pcIps[pcIdx][field] = value;
    setSwitches(newSwitches);
  };

  const addPcIp = (swIdx) => {
    const newSwitches = [...switches];
    if (!newSwitches[swIdx].pcIps) newSwitches[swIdx].pcIps = [];
    newSwitches[swIdx].pcIps.push({ pcName: '', ip: '', vlan: '', description: '' });
    setSwitches(newSwitches);
  };

  const removePcIp = (swIdx, pcIdx) => {
    const newSwitches = [...switches];
    if (newSwitches[swIdx].pcIps && newSwitches[swIdx].pcIps.length > 1) {
      newSwitches[swIdx].pcIps = newSwitches[swIdx].pcIps.filter((_, i) => i !== pcIdx);
      setSwitches(newSwitches);
    }
  };

  const updateTrunkPort = (swIdx, portIdx, value) => {
    const newSwitches = [...switches];
    if (!newSwitches[swIdx].trunkPorts) newSwitches[swIdx].trunkPorts = [];
    newSwitches[swIdx].trunkPorts[portIdx] = value;
    setSwitches(newSwitches);
  };

  const addTrunkPort = (swIdx) => {
    const newSwitches = [...switches];
    if (!newSwitches[swIdx].trunkPorts) newSwitches[swIdx].trunkPorts = [];
    newSwitches[swIdx].trunkPorts.push('gi0/1');
    setSwitches(newSwitches);
  };

  const removeTrunkPort = (swIdx, portIdx) => {
    const newSwitches = [...switches];
    if (newSwitches[swIdx].trunkPorts && newSwitches[swIdx].trunkPorts.length > 1) {
      newSwitches[swIdx].trunkPorts = newSwitches[swIdx].trunkPorts.filter((_, i) => i !== portIdx);
      setSwitches(newSwitches);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('¡Copiado!');
  };

  const downloadConfig = (text, switchName) => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    const filename = `${dateStr}-${switchName}.txt`;
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* CLI-Style Header */}
      <div className="cli-header">
        <pre className="cli-title">
{`
 ███████╗██╗███████╗ ██████╗ ██████╗ ██╗   ██╗
 ╚══███╔╝██║██╔════╝██╔════╝██╔═══██╗██║   ██║
   ███╔╝ ██║███████╗██║     ██║   ██║██║   ██║
  ███╔╝  ██║╚════██║██║     ██║   ██║╚██╗ ██╔╝
 ███████╗██║███████║╚██████╗╚██████╔╝ ╚████╔╝ 
 ╚══════╝╚═╝╚══════╝ ╚═════╝ ╚═════╝   ╚═══╝  
                                               
 Cisco VLAN Configuration Generator v1.0
 made by Joshua Velasco
`}
        </pre>
      </div>

      <div className="config-container">
      <div className="editor-section">
        {/* Column 1: Global VLANs */}
        <div>
          <h2>Global VLANs</h2>
          <div className="item-list">
            {vlans.map((vlan, index) => (
              <div key={index} className="item-row">
                <input value={vlan.id} placeholder="ID" onChange={(e) => {
                  const newVlans = [...vlans];
                  newVlans[index].id = e.target.value;
                  setVlans(newVlans);
                }} style={{ width: '60px' }} />
                <input value={vlan.name} placeholder="Nombre" onChange={(e) => {
                  const newVlans = [...vlans];
                  newVlans[index].name = e.target.value;
                  setVlans(newVlans);
                }} style={{ flex: 1 }} />
              </div>
            ))}
            <button className="btn btn-add" onClick={() => setVlans([...vlans, { id: '', name: '' }])}>+ Añadir VLAN Global</button>
          </div>
        </div>

        {/* Column 2: Switch Configuration */}
        <div>
          <div className="switch-header">
            <h3>Configure Switches</h3>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input 
                type="number" 
                min="1" 
                max="20" 
                placeholder="Cantidad"
                style={{ width: '80px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addMultipleSwitches(e.target.value);
                    e.target.value = '';
                  }
                }}
              />
              <button 
                className="btn btn-add" 
                onClick={(e) => {
                  const input = e.target.previousElementSibling;
                  addMultipleSwitches(input.value);
                  input.value = '';
                }}
              >
                Crear Múltiples
              </button>
              <button className="btn btn-add" onClick={addSwitch}>+ Nuevo Switch</button>
            </div>
          </div>

          <div className="switch-tabs">
            {switches.map((sw, idx) => (
              <div key={idx} className={`switch-tab ${activeIndex === idx ? 'active' : ''}`} onClick={() => setActiveIndex(idx)}>
                {sw.name}
                <span onClick={(e) => { e.stopPropagation(); removeSwitch(idx); }} style={{ opacity: 0.5 }}>×</span>
              </div>
            ))}
          </div>

          {switches[activeIndex] && (
            <div className="switch-editor">
              <div className="input-group">
                <label>Nombre del Switch</label>
                <input value={switches[activeIndex].name} onChange={(e) => updateSwitch(activeIndex, 'name', e.target.value)} style={{ width: '100%' }} />
              </div>

            <div className="input-group">
              <label className="vlan-checkbox" style={{ background: '#0d1117', padding: '0.75rem', borderRadius: '6px', border: '1px solid #30363d' }}>
                <input 
                  type="checkbox" 
                  checked={switches[activeIndex].isCore || false}
                  onChange={(e) => updateSwitch(activeIndex, 'isCore', e.target.checked)}
                />
                <strong>Switch Central/Puente</strong> (pasa todo el tráfico de VLANs)
              </label>
            </div>

            <div className="input-group">
              <label>VLANs e Interfaces para este Switch</label>
              {switches[activeIndex].isCore ? (
                <div style={{ padding: '1rem', background: '#0d1117', borderRadius: '6px', border: '1px solid #30363d', color: '#7ee787' }}>
                  ✓ Switch central configurado con TODAS las VLANs automáticamente
                </div>
              ) : (
                <div className="vlan-selector">
                  {vlans.map(vlan => (
                    vlan.id && (
                      <div key={vlan.id} style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#0d1117', padding: '0.75rem', borderRadius: '6px', border: '1px solid #30363d' }}>
                        <label className="vlan-checkbox" style={{ margin: 0 }}>
                          <input 
                            type="checkbox" 
                            checked={switches[activeIndex].selectedVlanIds?.includes(vlan.id)} 
                            onChange={() => updateSwitchVlans(activeIndex, vlan.id)}
                          />
                          <strong>VLAN {vlan.id}</strong> {vlan.name && `(${vlan.name})`}
                        </label>
                        {switches[activeIndex].selectedVlanIds?.includes(vlan.id) && (
                          <input 
                            type="text"
                            placeholder="Interfaces (ej: fa0/1-5, fa0/10)"
                            value={switches[activeIndex].vlanInterfaces?.[vlan.id] || ''}
                            onChange={(e) => updateVlanInterface(activeIndex, vlan.id, e.target.value)}
                            style={{ width: '100%', marginLeft: '1.5rem' }}
                          />
                        )}
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>

            <div className="input-group">
              <label>Puertos Trunk (VLAN 99 Native)</label>
              <div className="item-list">
                {(switches[activeIndex].trunkPorts || []).map((port, idx) => (
                  <div key={idx} className="item-row" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input 
                      className="trunk-input" 
                      placeholder="ej: gi0/1" 
                      value={port} 
                      onChange={(e) => updateTrunkPort(activeIndex, idx, e.target.value)} 
                      style={{ flex: 1 }}
                    />
                    <button className="btn btn-remove" onClick={() => removeTrunkPort(activeIndex, idx)}>×</button>
                  </div>
                ))}
                <button className="btn btn-add" onClick={() => addTrunkPort(activeIndex)}>+ Añadir Puerto Trunk</button>
              </div>
            </div>
          </div>
        )}
        </div>

        {/* Column 3: PC IPs for Active Switch */}
        <div>
          {switches[activeIndex] && (
            <>
              <h2>IPs de PCs - {switches[activeIndex].name}</h2>
              <div className="item-list">
                {(switches[activeIndex].pcIps || []).map((pc, idx) => (
                  <div key={idx} className="item-row" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input 
                      placeholder="Nombre PC" 
                      value={pc.pcName} 
                      onChange={(e) => updatePcIp(activeIndex, idx, 'pcName', e.target.value)} 
                      style={{ flex: '1' }} 
                    />
                    <input 
                      placeholder="IP" 
                      value={pc.ip} 
                      onChange={(e) => updatePcIp(activeIndex, idx, 'ip', e.target.value)} 
                      style={{ flex: '1' }} 
                    />
                    <input 
                      placeholder="VLAN" 
                      value={pc.vlan} 
                      onChange={(e) => updatePcIp(activeIndex, idx, 'vlan', e.target.value)} 
                      style={{ width: '60px' }} 
                    />
                    <input 
                      placeholder="Descripción" 
                      value={pc.description} 
                      onChange={(e) => updatePcIp(activeIndex, idx, 'description', e.target.value)} 
                      style={{ flex: '1.5' }} 
                    />
                    <button className="btn btn-remove" onClick={() => removePcIp(activeIndex, idx)}>×</button>
                  </div>
                ))}
              </div>
              <button className="btn btn-add" onClick={() => addPcIp(activeIndex)}>+ Añadir PC</button>
            </>
          )}
        </div>
      </div>


      <div className="preview-section">
        {/* PC IPs always in first column */}
        <div className="switch-result-card">
          <h3>
            All PC IP Templates
            <button className="btn btn-copy" onClick={() => copyToClipboard(pcIps)}>Copiar Todas las IPs</button>
          </h3>
          <pre className="preview-content" style={{ color: '#a5d6ff' }}>{pcIps}</pre>
        </div>

        {/* Switch configs in subsequent columns */}
        {switchConfigs.map((cfg, idx) => (
          <div key={idx} className="switch-result-card">
            <h3>
              Config: {cfg.name}
              {cfg.isCore && <span style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem', background: '#238636', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'normal' }}>CORE/PUENTE</span>}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-copy" onClick={() => copyToClipboard(cfg.cli)}>Copiar CLI</button>
                <button className="btn btn-copy" onClick={() => downloadConfig(cfg.cli, cfg.name)}>Descargar .txt</button>
              </div>
            </h3>
            <pre className="preview-content">{cfg.cli}</pre>
          </div>
        ))}
      </div>
    </div>
    </>
  );
};

export default Txt;
