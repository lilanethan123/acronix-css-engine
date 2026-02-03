/* d3-integration.js
   Minimal D3 v7 helper to create a responsive line chart bound to SVG that:
   - uses CSS classes from graph-engine.css for styling
   - animates initial draw via Ge.animatePath, and updates via D3 transitions
   - uses Ge.attachTooltip for polished tooltips

   Usage:
     createLineChart('#panel-line svg', dataArray, options)
     returns { update(newData), destroy() }
*/

(function(global){
  const Ge = global.Ge || (global.Ge = {});
  const d3 = global.d3; // expects d3 v7 loaded via <script src="https://d3js.org/d3.v7.min.js"></script>

  if (!d3) {
    console.warn('d3 not found — include D3 v7 to use d3-integration.js');
    return;
  }

  function createLineChart(selector, data, opts = {}) {
    opts = Object.assign({
      margin: { top: 12, right: 16, bottom: 28, left: 40 },
      duration: 700,
      curve: d3.curveMonotoneX,
      showArea: true,
      pointRadius: 5
    }, opts);

    const container = typeof selector === 'string' ? document.querySelector(selector) : selector;
    const svg = container.nodeName === 'svg' ? container : container.querySelector('svg');
    const width = svg.viewBox.baseVal.width || svg.clientWidth || 800;
    const height = svg.viewBox.baseVal.height || svg.clientHeight || 320;
    const innerW = width - opts.margin.left - opts.margin.right;
    const innerH = height - opts.margin.top - opts.margin.bottom;

    // Prepare group
    d3.select(svg).selectAll('*:not(defs)').remove(); // clear except defs

    const g = d3.select(svg)
      .append('g')
      .attr('class', 'ge-chart-group')
      .attr('transform', `translate(${opts.margin.left},${opts.margin.top})`);

    // scales — supports input as array of numbers or objects {x,y}
    function normalize(data){
      return data.map((d,i) => (typeof d === 'number' ? { x: i, y: d } : d));
    }

    let series = normalize(data);

    const x = d3.scaleLinear().domain(d3.extent(series, d=>d.x)).range([0, innerW]);
    const y = d3.scaleLinear().domain([d3.min(series,d=>d.y), d3.max(series,d=>d.y)]).nice().range([innerH, 0]);

    // grid lines
    g.append('g').attr('class','ge-grid')
      .selectAll('line').data([0.25,0.5,0.75,1].map(p=>p*innerH)).enter()
      .append('line')
      .attr('x1',0).attr('x2',innerW)
      .attr('y1',d=>d).attr('y2',d=>d);

    // area
    const areaGen = d3.area()
      .x(d=>x(d.x))
      .y0(innerH)
      .y1(d=>y(d.y))
      .curve(opts.curve);

    if (opts.showArea) {
      g.append('path')
        .datum(series)
        .attr('class','ge-area')
        .attr('d', areaGen);
    }

    // line
    const lineGen = d3.line().x(d=>x(d.x)).y(d=>y(d.y)).curve(opts.curve);

    const line = g.append('path')
      .datum(series)
      .attr('class','ge-line gradient ge-draw')
      .attr('d', lineGen)
      .attr('fill','none')
      .attr('stroke','url(#geGradientStroke)');

    // points group
    const pointsG = g.append('g').attr('class','ge-interactive');

    function drawPoints(dataPoints) {
      const pts = pointsG.selectAll('circle.ge-dot').data(dataPoints);
      pts.join(
        enter => enter.append('circle')
                      .attr('class','ge-dot')
                      .attr('r', opts.pointRadius)
                      .attr('cx', d => x(d.x))
                      .attr('cy', d => y(d.y))
                      .attr('fill','var(--g-surface)'),
        update => update
                      .transition().duration(opts.duration)
                      .attr('cx', d=>x(d.x))
                      .attr('cy', d=>y(d.y)),
        exit => exit.transition().duration(opts.duration).attr('r',0).remove()
      );
    }

    drawPoints(series);

    // Tooltip
    const parentPanel = svg.closest('.ge-panel') || svg.parentElement;
    const tip = Ge.attachTooltip(parentPanel || document.body);

    // pointer handlers
    function onMove(e) {
      const pt = d3.pointer(e, svg);
      const mx = x.invert(pt[0] - opts.margin.left);
      // find nearest
      const nearest = series.reduce((a,b) => Math.abs(b.x - mx) < Math.abs(a.x - mx) ? b : a);
      if (!nearest) return;
      const cx = x(nearest.x) + opts.margin.left;
      const cy = y(nearest.y) + opts.margin.top;
      tip.show(`<strong>${nearest.y}</strong><div class="ge-muted">x: ${nearest.x}</div>`, e.clientX, e.clientY);
    }
    svg.addEventListener('mousemove', onMove);
    svg.addEventListener('mouseleave', ()=> tip.hide());

    // initial draw animation using Ge.animatePath
    if (typeof Ge.animatePath === 'function') {
      Ge.animatePath(line.node(), { duration: Math.max(700, opts.duration) });
    } else {
      // fallback: simple transition
      line.transition().duration(opts.duration).attr('stroke-dashoffset', 0);
    }

    function update(newData) {
      series = normalize(newData);
      // update scales
      x.domain(d3.extent(series, d=>d.x));
      y.domain([d3.min(series,d=>d.y), d3.max(series,d=>d.y)]).nice();

      // update grid (if needed)
      g.select('.ge-area')
       .datum(series)
       .transition().duration(opts.duration).attr('d', areaGen);

      // update line with smooth path interpolation
      line.datum(series)
          .transition()
          .duration(opts.duration)
          .attrTween('d', function(d){
            const previous = this.__prev || lineGen(series.map(d=>({x:d.x,y:d.y})));
            this.__prev = lineGen(series.map(d=>({x:d.x,y:d.y})));
            const interpolator = d3.interpolatePath(previous, lineGen(d));
            return function(t){ return interpolator(t); };
          })
          .on('end', function(){
            // re-run stroke draw animations subtly for clarity
            if (Ge.animatePath) Ge.animatePath(this, { duration: Math.floor(opts.duration*0.85) });
          });

      // update points
      drawPoints(series);
    }

    function destroy(){
      svg.removeEventListener('mousemove', onMove);
      svg.removeEventListener('mouseleave', ()=> tip.hide());
      d3.select(svg).selectAll('*').remove();
    }

    return { update, destroy, svg, container };
  }

  // expose
  Ge.d3 = Ge.d3 || {};
  Ge.d3.createLineChart = createLineChart;

  global.Ge = Ge;
})(window);
