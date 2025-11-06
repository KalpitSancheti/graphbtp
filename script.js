// Graph Class
class Graph {
    constructor(numVertices) {
        this.numVertices = numVertices;
        this.adjMatrix = Array(numVertices).fill(0).map(() => Array(numVertices).fill(0));
    }

    addEdge(u, v) {
        this.adjMatrix[u][v] = 1;
        this.adjMatrix[v][u] = 1; // undirected
    }

    getDegree(v) {
        let degree = 0;
        for (let i = 0; i < this.numVertices; i++) {
            if (this.adjMatrix[v][i] === 1) degree++;
        }
        return degree;
    }

    getEdgeCount() {
        let count = 0;
        for (let i = 0; i < this.numVertices; i++) {
            for (let j = i + 1; j < this.numVertices; j++) {
                if (this.adjMatrix[i][j] === 1) count++;
            }
        }
        return count;
    }

    getDegreeSequence() {
        let degrees = [];
        for (let i = 0; i < this.numVertices; i++) {
            degrees.push(this.getDegree(i));
        }
        return degrees.sort((a, b) => a - b);
    }
}

// Graph Isomorphism Checker with Weisfeiler-Lehman
class GraphIsomorphism {
    constructor(g1, g2) {
        this.g1 = g1;
        this.g2 = g2;
        this.mapping = Array(g1.numVertices).fill(-1);
        this.used = Array(g2.numVertices).fill(false);
        this.colors1 = Array(g1.numVertices).fill(0);
        this.colors2 = Array(g2.numVertices).fill(0);
        this.phases = [];
    }

    // Weisfeiler-Lehman Color Refinement
    getColorSignature(v, graph, colors) {
        let neighborColors = [];
        for (let i = 0; i < graph.numVertices; i++) {
            if (graph.adjMatrix[v][i] === 1) {
                neighborColors.push(colors[i]);
            }
        }
        neighborColors.sort((a, b) => a - b);
        return colors[v] + ":" + neighborColors.join(",");
    }

    weisfeilerLehman(iterations = 5) {
        const n = this.g1.numVertices;

        // Initialize with degrees
        for (let i = 0; i < n; i++) {
            this.colors1[i] = this.g1.getDegree(i);
            this.colors2[i] = this.g2.getDegree(i);
        }

        // Iterative refinement
        for (let iter = 0; iter < iterations; iter++) {
            let signatureToColor = new Map();
            let newColors1 = Array(n).fill(0);
            let newColors2 = Array(n).fill(0);
            let nextColor = 0;

            // Refine colors for g1
            for (let v = 0; v < n; v++) {
                let sig = this.getColorSignature(v, this.g1, this.colors1);
                if (!signatureToColor.has(sig)) {
                    signatureToColor.set(sig, nextColor++);
                }
                newColors1[v] = signatureToColor.get(sig);
            }

            // Refine colors for g2 - DON'T CLEAR MAP!
            // Use the SAME signatureToColor map so same patterns get same colors
            for (let v = 0; v < n; v++) {
                let sig = this.getColorSignature(v, this.g2, this.colors2);
                if (!signatureToColor.has(sig)) {
                    signatureToColor.set(sig, nextColor++);
                }
                newColors2[v] = signatureToColor.get(sig);
            }

            // Check color distributions
            let colorCount1 = Array(100).fill(0);
            let colorCount2 = Array(100).fill(0);
            for (let i = 0; i < n; i++) {
                if (newColors1[i] < 100) colorCount1[newColors1[i]]++;
                if (newColors2[i] < 100) colorCount2[newColors2[i]]++;
            }

            if (JSON.stringify(colorCount1) !== JSON.stringify(colorCount2)) {
                return false; // NOT isomorphic
            }

            this.colors1 = newColors1;
            this.colors2 = newColors2;
        }

        return true; // Might be isomorphic
    }

    // Check if mapping is valid
    isValidMapping(u, v) {
        // Check colors
        if (this.colors1[u] !== this.colors2[v]) return false;

        // Check degree
        if (this.g1.getDegree(u) !== this.g2.getDegree(v)) return false;

        // Check edges with already mapped vertices
        for (let i = 0; i < this.g1.numVertices; i++) {
            if (this.mapping[i] !== -1) {
                let j = this.mapping[i];
                if (this.g1.adjMatrix[u][i] !== this.g2.adjMatrix[v][j]) {
                    return false;
                }
            }
        }

        return true;
    }

    // Backtracking
    findMapping(vertex) {
        if (vertex === this.g1.numVertices) {
            return true; // All vertices mapped
        }

        for (let v = 0; v < this.g2.numVertices; v++) {
            if (!this.used[v] && this.isValidMapping(vertex, v)) {
                this.mapping[vertex] = v;
                this.used[v] = true;

                if (this.findMapping(vertex + 1)) {
                    return true;
                }

                this.mapping[vertex] = -1;
                this.used[v] = false;
            }
        }

        return false;
    }

    // Main check function
    checkIsomorphism() {
        this.phases = [];

        // Phase 1: Quick checks
        if (this.g1.numVertices !== this.g2.numVertices) {
            this.phases.push("X Phase 1: Different vertex counts");
            return false;
        }

        let deg1 = this.g1.getDegreeSequence();
        let deg2 = this.g2.getDegreeSequence();
        if (JSON.stringify(deg1) !== JSON.stringify(deg2)) {
            this.phases.push("X Phase 1: Different degree sequences");
            return false;
        }
        this.phases.push("PASS Phase 1: Quick checks passed");

        // Phase 2: Weisfeiler-Lehman
        if (!this.weisfeilerLehman(5)) {
            this.phases.push("X Phase 2: WL refinement detected non-isomorphism");
            return false;
        }
        this.phases.push("PASS Phase 2: WL refinement passed (O(kn^2))");

        // Phase 3: Backtracking
        let result = this.findMapping(0);
        if (result) {
            this.phases.push("PASS Phase 3: Backtracking found valid mapping");
        } else {
            this.phases.push("X Phase 3: No valid mapping exists");
        }

        return result;
    }

    getMapping() {
        return this.mapping;
    }

    getPhases() {
        return this.phases;
    }
}

// Simple UI Functions
function parseEdges(edgeText) {
    let edges = [];
    let lines = edgeText.trim().split('\n');
    for (let line of lines) {
        line = line.trim();
        if (line) {
            let parts = line.split(/\s+/);
            if (parts.length >= 2) {
                edges.push([parseInt(parts[0]), parseInt(parts[1])]);
            }
        }
    }
    return edges;
}

function createGraph(vertices, edgeText) {
    let graph = new Graph(vertices);
    let edges = parseEdges(edgeText);
    for (let [u, v] of edges) {
        if (u >= 0 && u < vertices && v >= 0 && v < vertices && u !== v) {
            graph.addEdge(u, v);
        }
    }
    return graph;
}

// Check Button
document.getElementById('checkBtn').addEventListener('click', function() {
    let resultDiv = document.getElementById('result');
    
    try {
        let vertices1 = parseInt(document.getElementById('vertices1').value);
        let vertices2 = parseInt(document.getElementById('vertices2').value);
        let edges1 = document.getElementById('edges1').value;
        let edges2 = document.getElementById('edges2').value;
        
        if (!vertices1 || !vertices2 || vertices1 <= 0 || vertices2 <= 0) {
            resultDiv.innerHTML = '<p style="color:red;">Please enter valid vertices!</p>';
            return;
        }
        
        // Create graphs
        let g1 = createGraph(vertices1, edges1);
        let g2 = createGraph(vertices2, edges2);
        
        // Check isomorphism
        let iso = new GraphIsomorphism(g1, g2);
        let result = iso.checkIsomorphism();
        
        // Display result
        let output = '<h2>Results:</h2>';
        
        if (result) {
            output += '<p style="color:green; font-size:20px;"><b>SUCCESS - ISOMORPHIC!</b></p>';
            output += '<p>The graphs have the same structure.</p>';
            
            let mapping = iso.getMapping();
            output += '<h3>Vertex Mapping (Graph 1 -&gt; Graph 2):</h3>';
            output += '<p>';
            for (let i = 0; i < mapping.length; i++) {
                output += i + ' -&gt; ' + mapping[i] + ' &nbsp; ';
                if ((i + 1) % 5 === 0) output += '<br>';
            }
            output += '</p>';
        } else {
            output += '<p style="color:red; font-size:20px;"><b>NOT ISOMORPHIC</b></p>';
            output += '<p>The graphs have different structures.</p>';
        }
        
        // Show phases
        let phases = iso.getPhases();
        output += '<h3>Algorithm Steps:</h3>';
        for (let phase of phases) {
            output += '<p>' + phase + '</p>';
        }
        
        // Debug: Show colors after WL
        output += '<h3>Debug Info:</h3>';
        output += '<p><b>Colors after WL (G1):</b> [' + iso.colors1.join(', ') + ']</p>';
        output += '<p><b>Colors after WL (G2):</b> [' + iso.colors2.join(', ') + ']</p>';
        
        // Show graph info
        output += '<hr><h3>Graph Info:</h3>';
        output += '<p><b>Graph 1:</b> ' + g1.numVertices + ' vertices, ' + 
                  g1.getEdgeCount() + ' edges, Degrees: [' + 
                  g1.getDegreeSequence().join(', ') + ']</p>';
        output += '<p><b>Graph 2:</b> ' + g2.numVertices + ' vertices, ' + 
                  g2.getEdgeCount() + ' edges, Degrees: [' + 
                  g2.getDegreeSequence().join(', ') + ']</p>';
        
        resultDiv.innerHTML = output;
        
    } catch (error) {
        resultDiv.innerHTML = '<p style="color:red;"><b>Error:</b> ' + error.message + '</p>';
    }
});

// Clear Button
document.getElementById('clearBtn').addEventListener('click', function() {
    document.getElementById('vertices1').value = '';
    document.getElementById('vertices2').value = '';
    document.getElementById('edges1').value = '';
    document.getElementById('edges2').value = '';
    document.getElementById('result').innerHTML = '';
});

// Example Button
document.getElementById('exampleBtn').addEventListener('click', function() {
    document.getElementById('vertices1').value = '4';
    document.getElementById('edges1').value = '0 1\n1 2\n2 3\n3 0';
    document.getElementById('vertices2').value = '4';
    document.getElementById('edges2').value = '0 1\n1 2\n2 3\n3 0';
});
