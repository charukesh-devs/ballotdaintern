const{useState,useEffect,useRef,useCallback,useMemo}=React;
const{LineChart,Line,BarChart,Bar,PieChart,Pie,Cell,XAxis,YAxis,CartesianGrid,Tooltip:RechartsTooltip,Legend,ResponsiveContainer}=Recharts;

const METRIC_LABELS={hpi_latest:"House Price Index",airports:"Airports",building_permits_latest:"Building Permits",road_length_miles:"Road Miles",transit_ridership_upt:"Transit Ridership"};
const METRIC_KEYS=Object.keys(METRIC_LABELS);
const METRIC_COLORS={hpi_latest:"#1a5bd6",airports:"#0f9d6c",building_permits_latest:"#f5b02e",road_length_miles:"#8b5cf6",transit_ridership_upt:"#e00010"};
const CHART_COLORS=["#1a5bd6","#0f9d6c","#f5b02e","#8b5cf6","#e00010","#ec4899","#14b8a6","#f97316","#06b6d4","#3b82f6"];

function formatNum(n){if(n==null||n===0)return"\u2014";if(n>=1e9)return(n/1e9).toFixed(1)+"B";if(n>=1e6)return(n/1e6).toFixed(1)+"M";if(n>=1e3)return(n/1e3).toFixed(1)+"K";return typeof n==="number"?n.toLocaleString():n}
function formatRaw(n){if(n==null)return 0;return n}

const ICONS={
  airports:function(c){return React.createElement("svg",{viewBox:"0 0 24 24",fill:"none",stroke:c,strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"},
    React.createElement("path",{d:"M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.4-.1.9.3 1.1l5.3 3.1-2.2 2.2L6 15l1.8.7 2.2-2.2 3.1 5.3c.2.4.7.5 1.1.3l.5-.3c.4-.2.6-.6.5-1.1z"}))},
  runways:function(c){return React.createElement("svg",{viewBox:"0 0 24 24",fill:"none",stroke:c,strokeWidth:2,strokeLinecap:"round"},
    React.createElement("rect",{x:2,y:10,width:20,height:4,rx:1}),
    React.createElement("line",{x1:6,y1:10,x2:6,y2:14}),
    React.createElement("line",{x1:10,y1:10,x2:10,y2:14}),
    React.createElement("line",{x1:14,y1:10,x2:14,y2:14}),
    React.createElement("line",{x1:18,y1:10,x2:18,y2:14}))},
  roads:function(c){return React.createElement("svg",{viewBox:"0 0 24 24",fill:"none",stroke:c,strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"},
    React.createElement("path",{d:"M4 19L8 5"}),
    React.createElement("path",{d:"M16 5L20 19"}),
    React.createElement("line",{x1:10,y1:9,x2:14,y2:9}),
    React.createElement("line",{x1:9,y1:13,x2:15,y2:13}))},
  permits:function(c){return React.createElement("svg",{viewBox:"0 0 24 24",fill:"none",stroke:c,strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"},
    React.createElement("path",{d:"M3 21h18"}),
    React.createElement("path",{d:"M5 21V7l7-4 7 4v14"}),
    React.createElement("rect",{x:9,y:9,width:6,height:6,rx:0.5}))},
  hpi:function(c){return React.createElement("svg",{viewBox:"0 0 24 24",fill:"none",stroke:c,strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"},
    React.createElement("polyline",{points:"22,7 13.5,15.5 8.5,10.5 2,17"}),
    React.createElement("polyline",{points:"16,7 22,7 22,13"}))},
  transit:function(c){return React.createElement("svg",{viewBox:"0 0 24 24",fill:"none",stroke:c,strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"},
    React.createElement("rect",{x:3,y:3,width:18,height:14,rx:2}),
    React.createElement("path",{d:"M3 10h18"}),
    React.createElement("circle",{cx:7,cy:21,r:1.5}),
    React.createElement("circle",{cx:17,cy:21,r:1.5}),
    React.createElement("line",{x1:5.5,y1:17,x2:7,y2:19.5}),
    React.createElement("line",{x1:18.5,y1:17,x2:17,y2:19.5}))}
};
const ICON_KEYS={airports:"airports",runways:"runways",road_length_miles:"roads",building_permits_latest:"permits",hpi_latest:"hpi",transit_ridership_upt:"transit"};
const STAT_ICONS={airports:"airports",runways:"runways",road_length_miles:"roads",building_permits_latest:"permits",hpi_latest:"hpi",transit_ridership_upt:"transit",vehicle_miles_millions:"roads",transit_agencies:"transit",population:"permits"};

const MAP_COLORS=["#e8f0fe","#c5dafb","#9bbef5","#6d9eeb","#4285f4","#2a75e0","#1a5bd6","#0c447c"];
function getColorForValue(t){t=Math.max(0,Math.min(1,t));const idx=Math.min(Math.floor(t*(MAP_COLORS.length-1)),MAP_COLORS.length-2);const localT=(t*(MAP_COLORS.length-1))-idx;return interpolateColor(MAP_COLORS[idx],MAP_COLORS[idx+1],localT)}
function interpolateColor(c1,c2,t){const r1=parseInt(c1.slice(1,3),16),g1=parseInt(c1.slice(3,5),16),b1=parseInt(c1.slice(5,7),16);const r2=parseInt(c2.slice(1,3),16),g2=parseInt(c2.slice(3,5),16),b2=parseInt(c2.slice(5,7),16);const r=Math.round(r1+(r2-r1)*t),g=Math.round(g1+(g2-g1)*t),b=Math.round(b1+(b2-b1)*t);return"rgb("+r+","+g+","+b+")"}

function StatePicker({states,selected,onSelect,open,onToggle}){
  const ref=useRef(null);
  const [search,setSearch]=useState("");
  const filtered=useMemo(()=>{
    if(!states)return[];
    let list=Object.values(states);
    if(search){const t=search.toLowerCase();list=list.filter(s=>s.name.toLowerCase().includes(t)||s.abbr.toLowerCase().includes(t))}
    return list.sort((a,b)=>a.name.localeCompare(b.name));
  },[states,search]);
  useEffect(()=>{
    function handleClick(e){if(ref.current&&!ref.current.contains(e.target))onToggle(false)}
    document.addEventListener("mousedown",handleClick);return()=>document.removeEventListener("mousedown",handleClick);
  },[onToggle]);
  return React.createElement("div",{className:"picker",ref:ref},
    React.createElement("input",{className:"picker-input",type:"text",placeholder:"Search states\u2026",value:open?search:(selected?states[selected]?.name||"":""),
      onFocus:()=>onToggle(true),onChange:e=>setSearch(e.target.value),readOnly:!open}),
    React.createElement("span",{className:"picker-arrow"},open?"\u25B2":"\u25BC"),
    React.createElement("div",{className:"picker-list"+(open?" open":"")},
      filtered.map(s=>React.createElement("div",{key:s.abbr,className:"picker-item"+(s.abbr===selected?" selected":""),
        onClick:()=>{onSelect(s.abbr);onToggle(false);setSearch("")}},
        React.createElement("span",null,s.name),
        React.createElement("span",{className:"abbr"},s.abbr)))
    ));
}

function KPICards({summary}){
  var totalMax=Math.max(summary.total_airports,summary.total_runways,summary.total_road_miles/100,summary.total_building_permits,summary.total_transit_ridership/1e6);
  var cards=[
    {key:"airports",label:"Airports",value:summary.total_airports,raw:summary.total_airports,pct:summary.total_airports/totalMax,sub:"Commercial + General Aviation"},
    {key:"runways",label:"Runways",value:summary.total_runways,raw:summary.total_runways,pct:summary.total_runways/totalMax,sub:"Active runway count"},
    {key:"roads",label:"Road Miles",value:summary.total_road_miles,raw:summary.total_road_miles,pct:(summary.total_road_miles/100)/totalMax,sub:"Public road network"},
    {key:"permits",label:"Building Permits",value:summary.total_building_permits,raw:summary.total_building_permits,pct:summary.total_building_permits/totalMax,sub:"Residential permits"},
    {key:"hpi",label:"Avg HPI",value:summary.avg_hpi?summary.avg_hpi.toFixed(1):"\u2014",raw:summary.avg_hpi,pct:(summary.avg_hpi||0)/600,sub:"House Price Index"},
    {key:"transit",label:"Transit Ridership",value:summary.total_transit_ridership,raw:summary.total_transit_ridership,pct:(summary.total_transit_ridership/1e6)/totalMax,sub:"Unlinked passenger trips"}
  ];
  var colorMap={airports:"var(--metric-airports)",runways:"var(--metric-runways)",roads:"var(--metric-roads)",permits:"var(--metric-permits)",hpi:"var(--metric-hpi)",transit:"var(--metric-transit)"};
  return React.createElement("div",{className:"kpi-row"},cards.map(function(c,i){
    var col=colorMap[c.key];
    return React.createElement("div",{className:"kpi-card",key:i,style:{animationDelay:i*60+"ms"}},
      React.createElement("div",{className:"kpi-header"},
        React.createElement("div",{className:"kpi-icon",style:{background:col+"18"}},
          ICONS[c.key]?ICONS[c.key](col):null),
        React.createElement("div",{className:"kpi-label"},c.label)),
      React.createElement("div",{className:"kpi-value",style:{color:col}},formatNum(c.value)),
      React.createElement("div",{className:"kpi-bar"},
        React.createElement("div",{className:"kpi-bar-fill",style:{width:Math.min(c.pct*100,100)+"%",background:col}})),
      React.createElement("div",{className:"kpi-sub"},c.sub));
  }));
}

function ColorLegend({metric}){
  var col=METRIC_COLORS[metric]||"#1a5bd6";
  var grad="linear-gradient(to right,"+MAP_COLORS[0]+","+MAP_COLORS[MAP_COLORS.length-1]+")";
  return React.createElement("div",{className:"map-legend"},
    React.createElement("span",{style:{fontSize:"0.68rem",color:"var(--color-text-dim)",fontFamily:"var(--font-display)"}},METRIC_LABELS[metric]),
    React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:2}},
      React.createElement("div",{className:"map-legend-bar",style:{background:grad}}),
      React.createElement("div",{className:"map-legend-labels"},
        React.createElement("span",null,"Low"),
        React.createElement("span",null,"High"))));
}

function USMap({states,metric,selectedState,onSelect,onHover}){
  var containerRef=useRef(null);
  var mountedRef=useRef(false);
  var metricKey=metric||"hpi_latest";

  useEffect(function(){
    if(!containerRef.current||!window.US_MAP||mountedRef.current)return;
    var map=window.US_MAP;
    containerRef.current.innerHTML="";
    var svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
    svg.setAttribute("viewBox",map.viewBox);
    svg.setAttribute("preserveAspectRatio","xMidYMid meet");
    svg.style.width="100%";
    svg.style.height="auto";

    var g=document.createElementNS("http://www.w3.org/2000/svg","g");
    map.locations.forEach(function(loc){
      var path=document.createElementNS("http://www.w3.org/2000/svg","path");
      path.setAttribute("d",loc.path);
      path.setAttribute("class","state-path");
      path.setAttribute("data-id",loc.id);
      path.addEventListener("click",function(){onSelect(loc.id.toUpperCase())});
      path.addEventListener("mouseenter",function(e){onHover(loc.id.toUpperCase(),e)});
      path.addEventListener("mousemove",function(e){onHover(loc.id.toUpperCase(),e)});
      path.addEventListener("mouseleave",function(){onHover(null)});
      g.appendChild(path);
    });
    svg.appendChild(g);

    var labelsG=document.createElementNS("http://www.w3.org/2000/svg","g");
    map.locations.forEach(function(loc){
      if(loc.id==="dc")return;
      var pathEl=g.querySelector('[data-id="'+loc.id+'"]');
      if(!pathEl)return;
      var bbox=pathEl.getBBox();
      var minDim=Math.min(bbox.width,bbox.height);
      if(minDim<18)return;
      var fontSize=minDim<30?8:minDim<50?9.5:11;
      var text=document.createElementNS("http://www.w3.org/2000/svg","text");
      text.setAttribute("x",bbox.x+bbox.width/2);
      text.setAttribute("y",bbox.y+bbox.height/2);
      text.setAttribute("class","state-label");
      text.style.fontSize=fontSize+"px";
      text.textContent=loc.id.toUpperCase();
      labelsG.appendChild(text);
    });
    svg.appendChild(labelsG);
    containerRef.current.appendChild(svg);
    mountedRef.current=true;
  },[]);

  useEffect(function(){
    if(!containerRef.current)return;
    var paths=containerRef.current.querySelectorAll(".state-path");
    var vals=[];
    paths.forEach(function(p){
      var abbr=p.getAttribute("data-id");
      if(abbr)abbr=abbr.toUpperCase();
      var s=states[abbr];
      if(s&&s[metricKey]!=null&&s[metricKey]!==0)vals.push(s[metricKey]);
    });
    var min=vals.length?Math.min.apply(null,vals):0;
    var max=vals.length?Math.max.apply(null,vals):1;

    paths.forEach(function(p){
      var abbr=p.getAttribute("data-id");
      if(abbr)abbr=abbr.toUpperCase();
      var s=states[abbr];
      if(!s){p.style.fill="#ccc";return}
      var val=s[metricKey]||0;
      var t=max===min?0.5:(val-min)/(max-min);
      p.style.fill=getColorForValue(t);
      p.classList.toggle("selected",abbr===selectedState);
    });
  },[states,metricKey,selectedState]);

  return React.createElement("div",{ref:containerRef,id:"us-map"});
}

function StatGrid({state:s}){
  var stats=[
    {key:"airports",label:"Airports",value:formatNum(s.airports),raw:s.airports},
    {key:"runways",label:"Runways",value:formatNum(s.runways),raw:s.runways},
    {key:"roads",label:"Road Miles",value:formatNum(s.road_length_miles),raw:s.road_length_miles},
    {key:"roads",label:"Vehicle Miles (M)",value:formatNum(s.vehicle_miles_millions),raw:s.vehicle_miles_millions},
    {key:"hpi",label:"HPI ("+(s.hpi_year||"")+")",value:s.hpi_latest!=null?s.hpi_latest.toFixed(1):"\u2014",raw:s.hpi_latest||0},
    {key:"permits",label:"Building Permits",value:formatNum(s.building_permits_latest),raw:s.building_permits_latest},
    {key:"transit",label:"Transit Agencies",value:formatNum(s.transit_agencies),raw:s.transit_agencies},
    {key:"transit",label:"Transit Ridership",value:formatNum(s.transit_ridership_upt),raw:s.transit_ridership_upt},
    {key:"permits",label:"Population",value:formatNum(s.population),raw:s.population}
  ];
  var colorMap={airports:"var(--metric-airports)",runways:"var(--metric-runways)",roads:"var(--metric-roads)",permits:"var(--metric-permits)",hpi:"var(--metric-hpi)",transit:"var(--metric-transit)"};
  return React.createElement("div",{className:"stat-grid"},
    stats.map(function(st,i){
      var col=colorMap[st.key]||"var(--bd-blue)";
      return React.createElement("div",{className:"stat-row",key:i,style:{animationDelay:i*40+"ms"}},
        React.createElement("div",{className:"stat-icon",style:{background:col+"18"}},
          ICONS[st.key]?ICONS[st.key](col):null),
        React.createElement("span",{className:"stat-label"},st.label),
        React.createElement("span",{className:"stat-value",style:{color:col}},st.value));
    }));
}

function Charts({state:s}){
  var ttStyle={background:"var(--color-surface)",border:"1px solid var(--color-border)",borderRadius:8,color:"var(--color-text)",fontSize:12,fontFamily:"var(--font-body)"};
  var hpiData=s.hpi_trend||[];
  var permitData=s.building_permits_trend||[];
  var airportData=(s.airport_types||[]).map(function(t){return{name:(t.type||"").replace(/"/g,"").replace(/_/g," "),value:t.count}}).filter(function(d){return d.value>0});
  var roadVal=s.road_length_miles||0;
  var vehVal=s.vehicle_miles_millions||0;
  var barData=[{name:"Road Mi (K)",value:roadVal/1000,color:"#8b5cf6"},{name:"Veh Mi (M)",value:vehVal/1000,color:"#0f9d6c"}];

  return React.createElement("div",{className:"charts-grid"},
    React.createElement("div",{className:"chart-card"},
      React.createElement("div",{className:"chart-header"},
        React.createElement("div",{className:"chart-icon",style:{background:"var(--metric-hpi)18"}},ICONS.hpi("var(--metric-hpi)")),
        React.createElement("div",{className:"chart-title"},"HPI Trend")),
      hpiData.length?React.createElement(ResponsiveContainer,{width:"100%",height:200},
        React.createElement(LineChart,{data:hpiData,margin:{top:5,right:10,left:-10,bottom:5}},
          React.createElement(CartesianGrid,{strokeDasharray:"3 3",stroke:"var(--color-border)"}),
          React.createElement(XAxis,{dataKey:"year",tick:{fill:"var(--color-text-dim)",fontSize:10},tickLine:false}),
          React.createElement(YAxis,{tick:{fill:"var(--color-text-dim)",fontSize:10},tickLine:false,axisLine:false}),
          React.createElement(RechartsTooltip,{contentStyle:ttStyle}),
          React.createElement(Line,{type:"monotone",dataKey:"hpi",stroke:"var(--metric-hpi)",strokeWidth:2,dot:false,activeDot:{r:4,fill:"var(--metric-hpi)"}}))
      ):React.createElement("div",{className:"chart-empty"},"No HPI data")),
    React.createElement("div",{className:"chart-card"},
      React.createElement("div",{className:"chart-header"},
        React.createElement("div",{className:"chart-icon",style:{background:"var(--metric-permits)18"}},ICONS.permits("var(--metric-permits)")),
        React.createElement("div",{className:"chart-title"},"Building Permits")),
      permitData.length?React.createElement(ResponsiveContainer,{width:"100%",height:200},
        React.createElement(BarChart,{data:permitData,margin:{top:5,right:10,left:-10,bottom:5}},
          React.createElement(CartesianGrid,{strokeDasharray:"3 3",stroke:"var(--color-border)"}),
          React.createElement(XAxis,{dataKey:"year",tick:{fill:"var(--color-text-dim)",fontSize:10},tickLine:false}),
          React.createElement(YAxis,{tick:{fill:"var(--color-text-dim)",fontSize:10},tickLine:false,axisLine:false}),
          React.createElement(RechartsTooltip,{contentStyle:ttStyle}),
          React.createElement(Bar,{dataKey:"permits",fill:"var(--metric-permits)",radius:[4,4,0,0]}))
      ):React.createElement("div",{className:"chart-empty"},"No permits data")),
    React.createElement("div",{className:"chart-card"},
      React.createElement("div",{className:"chart-header"},
        React.createElement("div",{className:"chart-icon",style:{background:"var(--metric-airports)18"}},ICONS.airports("var(--metric-airports)")),
        React.createElement("div",{className:"chart-title"},"Airport Types")),
      airportData.length?React.createElement(ResponsiveContainer,{width:"100%",height:200},
        React.createElement(PieChart,null,
          React.createElement(Pie,{data:airportData,cx:"50%",cy:"50%",outerRadius:65,dataKey:"value",
            label:function(p){return p.name+" ("+p.value+")"},labelLine:false},
            airportData.map(function(_,i){return React.createElement(Cell,{key:i,fill:CHART_COLORS[i%CHART_COLORS.length]})})),
          React.createElement(RechartsTooltip,{contentStyle:ttStyle}),
          React.createElement(Legend,{wrapperStyle:{fontSize:10,color:"var(--color-text-dim)",paddingTop:4}})))
      :React.createElement("div",{className:"chart-empty"},"No airport data")),
    React.createElement("div",{className:"chart-card"},
      React.createElement("div",{className:"chart-header"},
        React.createElement("div",{className:"chart-icon",style:{background:"var(--metric-roads)18"}},ICONS.roads("var(--metric-roads)")),
        React.createElement("div",{className:"chart-title"},"Road vs Vehicle Miles (K)")),
      React.createElement(ResponsiveContainer,{width:"100%",height:200},
        React.createElement(BarChart,{data:barData,layout:"vertical",margin:{top:5,right:10,left:10,bottom:5}},
          React.createElement(CartesianGrid,{strokeDasharray:"3 3",stroke:"var(--color-border)"}),
          React.createElement(XAxis,{type:"number",tick:{fill:"var(--color-text-dim)",fontSize:10},tickLine:false}),
          React.createElement(YAxis,{type:"category",dataKey:"name",tick:{fill:"var(--color-text-dim)",fontSize:10},width:85,tickLine:false,axisLine:false}),
          React.createElement(RechartsTooltip,{contentStyle:ttStyle}),
          React.createElement(Bar,{dataKey:"value",radius:[0,4,4,0]},
            barData.map(function(d,i){return React.createElement(Cell,{key:i,fill:d.color})})))))
  );
}

function DataTable({states,selectedState,onSelect,sortCol,sortDir,onSort,searchTerm}){
  var list=useMemo(function(){
    var l=Object.values(states);
    if(searchTerm){var t=searchTerm.toLowerCase();l=l.filter(function(s){return s.name.toLowerCase().indexOf(t)!==-1||s.abbr.toLowerCase().indexOf(t)!==-1})}
    l.sort(function(a,b){
      var va=a[sortCol],vb=b[sortCol];
      if(va==null)va=0;if(vb==null)vb=0;
      if(typeof va==="string")return sortDir==="asc"?va.localeCompare(vb):vb.localeCompare(va);
      return sortDir==="asc"?va-vb:vb-va;
    });
    return l;
  },[states,sortCol,sortDir,searchTerm]);
  var cols=[
    {key:"abbr",label:"Abbr",w:52},{key:"name",label:"State",w:120},{key:"population",label:"Population",w:92},
    {key:"airports",label:"Airports",w:75},{key:"runways",label:"Runways",w:70},{key:"road_length_miles",label:"Road Miles",w:90},
    {key:"vehicle_miles_millions",label:"Veh Miles(M)",w:100},{key:"hpi_latest",label:"HPI",w:70},
    {key:"building_permits_latest",label:"Permits",w:80},{key:"transit_ridership_upt",label:"Transit",w:95}
  ];
  return React.createElement("div",{className:"table-wrapper"},
    React.createElement("table",null,
      React.createElement("thead",null,
        React.createElement("tr",null,cols.map(function(c){
          return React.createElement("th",{key:c.key,style:{minWidth:c.w},className:sortCol===c.key?"sorted":"",onClick:function(){onSort(c.key)}},
            c.label,sortCol===c.key?React.createElement("span",{className:"arrow"},sortDir==="asc"?"\u25B2":"\u25BC"):"");
        }))),
      React.createElement("tbody",null,list.map(function(s){
        return React.createElement("tr",{key:s.abbr,className:s.abbr===selectedState?"selected":"",onClick:function(){onSelect(s.abbr)},style:{cursor:"pointer"}},
          React.createElement("td",null,React.createElement("strong",null,s.abbr)),
          React.createElement("td",null,s.name),
          React.createElement("td",null,formatNum(s.population)),
          React.createElement("td",null,formatNum(s.airports)),
          React.createElement("td",null,formatNum(s.runways)),
          React.createElement("td",null,formatNum(s.road_length_miles)),
          React.createElement("td",null,formatNum(s.vehicle_miles_millions)),
          React.createElement("td",null,s.hpi_latest!=null?s.hpi_latest.toFixed(1):"\u2014"),
          React.createElement("td",null,formatNum(s.building_permits_latest)),
          React.createElement("td",null,formatNum(s.transit_ridership_upt)));
      }))));
}

function Landing({data,selectedState,setSelectedState,onNavigate,metric,setMetric}){
  var pickerOpenState=useState(false);
  var pickerOpen=pickerOpenState[0];
  var setPickerOpen=pickerOpenState[1];

  var rankMap=useMemo(function(){
    var r={};
    METRIC_KEYS.forEach(function(k){
      var sorted=Object.values(data.states).filter(function(s){return s[k]!=null}).sort(function(a,b){return(b[k]||0)-(a[k]||0)});
      sorted.forEach(function(s,i){if(!r[s.abbr])r[s.abbr]={};r[s.abbr][k]=i+1});
    });
    return r;
  },[data]);

  var hoverHandler=useCallback(function(abbr,e){
    var el=document.getElementById("tooltip-el");
    if(!abbr||!data){el.className="tooltip";return}
    var s=data.states[abbr];if(!s){el.className="tooltip";return}
    var val=s[metric];
    var rank=rankMap[abbr]&&rankMap[abbr][metric];
    el.className="tooltip visible";
    var html='<div class="tt-name">'+s.name+'</div>';
    if(rank)html+='<div class="tt-rank">#'+rank+' in nation</div>';
    html+='<div class="tt-metric">'+(METRIC_LABELS[metric]||"HPI")+'</div>';
    html+='<div class="tt-value">'+formatNum(val)+'</div>';
    el.innerHTML=html;
    if(e&&e.clientX){el.style.left=(e.clientX+14)+"px";el.style.top=(e.clientY-14)+"px"}
  },[data,metric,rankMap]);

  return React.createElement("div",{className:"app"},
    React.createElement("header",{className:"header"},
      React.createElement("div",{className:"header-left"},
        React.createElement("h1",null,"America250"),
        React.createElement("span",{className:"subtitle"},"U.S. Real Estate & Infrastructure"))),
    React.createElement("div",{className:"hero"},
      React.createElement("h2",null,"Explore Your Nation"),
      React.createElement("p",null,"Interactive data on housing, airports, roads, transit, and building permits across all 50 states.")),
    React.createElement("div",{className:"picker-wrap"},
      React.createElement(StatePicker,{states:data.states,selected:selectedState,
        onSelect:function(abbr){setSelectedState(abbr);onNavigate(abbr)},
        open:pickerOpen,onToggle:setPickerOpen})),
    React.createElement(KPICards,{summary:data.summary}),
    React.createElement("div",{className:"map-section"},
      React.createElement("h3",null,"Interactive Map"),
      React.createElement("div",{className:"filter-bar"},
        METRIC_KEYS.map(function(k){
          return React.createElement("button",{key:k,"data-metric":k,className:"filter-pill"+(metric===k?" active":""),onClick:function(){setMetric(k)}},METRIC_LABELS[k]);
        }),
        React.createElement("button",{className:"btn-details",disabled:!selectedState,onClick:function(){if(selectedState)onNavigate(selectedState)}},
          "View State Details \u2192")),
      React.createElement("div",{className:"map-card"},
        React.createElement(USMap,{states:data.states,metric:metric,selectedState:selectedState,
          onSelect:function(abbr){setSelectedState(abbr);onNavigate(abbr)},
          onHover:hoverHandler}),
        React.createElement(ColorLegend,{metric:metric}))),
    React.createElement("div",{className:"table-section"},
      React.createElement("h3",null,"All States Data"),
      React.createElement(DataTable,{states:data.states,selectedState:selectedState,onSelect:function(abbr){setSelectedState(abbr);onNavigate(abbr)},
        sortCol:"name",sortDir:"asc",onSort:function(){},searchTerm:""})),
    React.createElement("div",{className:"footer"},"America250 Dashboard \u00B7 Data sourced from FHFA, FAA, FHWA, NTD, Census Bureau"));
}

function StateDetail({abbr,data,onBack}){
  var s=data.states[abbr];
  var handleHover=useCallback(function(hAbbr,e){
    var el=document.getElementById("tooltip-el");
    if(!hAbbr||!data){el.className="tooltip";return}
    var st=data.states[hAbbr];if(!st){el.className="tooltip";return}
    el.className="tooltip visible";
    el.innerHTML='<div class="tt-name">'+st.name+'</div><div class="tt-metric">Airports</div><div class="tt-value">'+formatNum(st.airports)+'</div>';
    if(e&&e.clientX){el.style.left=(e.clientX+14)+"px";el.style.top=(e.clientY-14)+"px"}
  },[data]);
  if(!s)return React.createElement("div",{className:"loading"},"State not found");
  return React.createElement("div",{className:"app"},
    React.createElement("header",{className:"header"},
      React.createElement("div",{className:"header-left"},
        React.createElement("button",{className:"btn-back",onClick:onBack},"\u2190 Back"),
        React.createElement("h1",null,"America250"))),
    React.createElement("div",{className:"state-detail"},
      React.createElement("div",{className:"state-hero"},
        React.createElement("h2",null,s.name),
        React.createElement("span",{className:"abbr-badge"},s.abbr)),
      React.createElement(StatGrid,{state:s}),
      React.createElement(Charts,{state:s})),
    React.createElement("div",{className:"map-section",style:{paddingTop:0}},
      React.createElement("h3",null,"National Overview"),
      React.createElement("div",{className:"map-card"},
        React.createElement(USMap,{states:data.states,metric:"hpi_latest",selectedState:abbr,
          onSelect:function(){},onHover:handleHover}),
        React.createElement(ColorLegend,{metric:"hpi_latest"}))),
    React.createElement("div",{className:"footer"},"America250 Dashboard \u00B7 Data sourced from FHFA, FAA, FHWA, NTD, Census Bureau"));
}

function App(){
  var dataState=useState(null);
  var data=dataState[0];
  var setData=dataState[1];
  var loadingState=useState(true);
  var loading=loadingState[0];
  var setLoading=loadingState[1];
  var pageState=useState("landing");
  var page=pageState[0];
  var setPage=pageState[1];
  var selState=useState(null);
  var selectedState=selState[0];
  var setSelectedState=selState[1];
  var metricState=useState("hpi_latest");
  var metric=metricState[0];
  var setMetric=metricState[1];

  useEffect(function(){
    Promise.all([
      fetch("/api/states").then(function(r){return r.json()}),
      fetch("/api/summary").then(function(r){return r.json()})
    ]).then(function(results){
      var statesArr=results[0];
      var summary=results[1];
      var states={};
      statesArr.forEach(function(s){states[s.abbr]=s});
      setData({states:states,summary:summary});
      setLoading(false);
    }).catch(function(e){console.error(e);setLoading(false)});
  },[]);

  var navigateTo=useCallback(function(abbr){
    if(abbr){setSelectedState(abbr);setPage("detail");window.history.pushState({page:"detail",abbr:abbr},"","/state/"+abbr)}
  },[]);
  var goHome=useCallback(function(){setPage("landing");window.history.pushState({page:"landing"},"","/")},[]);

  useEffect(function(){
    function handlePop(){var st=history.state||{};if(st.page==="detail"&&st.abbr){setPage("detail");setSelectedState(st.abbr)}else{setPage("landing")}}
    window.addEventListener("popstate",handlePop);
    var initial=window.location.pathname.match(/^\/state\/([a-zA-Z]{2})$/);
    if(initial){setSelectedState(initial[1].toUpperCase());setPage("detail");window.history.replaceState({page:"detail",abbr:initial[1].toUpperCase()},"","/state/"+initial[1].toUpperCase())}
    return function(){window.removeEventListener("popstate",handlePop)};
  },[]);

  if(loading)return React.createElement("div",{className:"loading"},"Loading dashboard\u2026");
  if(!data)return React.createElement("div",{className:"loading"},"Error loading data.");

  if(page==="detail"&&selectedState){
    return React.createElement(StateDetail,{abbr:selectedState,data:data,onBack:goHome});
  }
  return React.createElement(Landing,{data:data,selectedState:selectedState,setSelectedState:setSelectedState,
    onNavigate:navigateTo,metric:metric,setMetric:setMetric});
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
