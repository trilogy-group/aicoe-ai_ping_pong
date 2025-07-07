# AI Ping-Pong Studio v4 - Automated Topic Processing

## Overview

The `process_topics.sh` script automates the entire AI workflow to process multiple topics from a text file and generate high-quality markdown articles in parallel. Each topic goes through the complete validation pipeline including Google search validation.

## Quick Start

### 1. Prepare Your Topics File

Create or edit `topics.txt` with numbered topics:

```
1. The Future of Renewable Energy Technologies
2. Impact of Artificial Intelligence on Healthcare
3. Sustainable Urban Planning for Smart Cities
4. Blockchain Technology in Supply Chain Management
5. Climate Change Mitigation Strategies
```

### 2. Start the API Server

```bash
# Make sure the server is running
node api-server-v4.cjs
```

### 3. Run the Automation Script

```bash
# Basic usage (processes all topics with default settings)
./process_topics.sh

# With custom options
./process_topics.sh -j 5 -s research -t my_topics.txt -o articles
```

## Features

### 🚀 **Parallel Processing**

- Processes multiple topics simultaneously
- Configurable parallel job limit (default: 3)
- Efficient resource utilization

### 🛡️ **Error Isolation**

- Each topic runs independently
- One failure doesn't affect others
- Comprehensive error handling

### 📊 **Comprehensive Logging**

- Individual log file for each topic
- Detailed processing steps
- API request/response logging
- Summary report generation

### 🔍 **Complete Validation Pipeline**

- Multi-model source validation
- Google search validation
- Final source verification and cleanup
- Invalid source removal

## Workflow Steps

Each topic goes through these steps:

1. **Brief Clarification** (GPT) - Clarifies and expands the topic
2. **Deep Research** (Gemini) - Comprehensive research with sources
3. **First Draft** (GPT) - Initial article structure
4. **Logical Enhancement** (Claude) - Improves logical flow
5. **Creative Polish** (GPT) - Enhances writing style
6. **Multi-Model Source Validation** (All Models) - Cross-validates sources
7. **Google Search Validation** (Google Search) - Real-world source verification
8. **Final Source Verification** (Claude) - Removes invalid sources
9. **Production Ready** (GPT) - Final publication-ready article

## Command Line Options

```bash
./process_topics.sh [OPTIONS]

Options:
  -h, --help          Show help message
  -t, --topics FILE   Topics file (default: topics.txt)
  -o, --output DIR    Output directory (default: outputs)
  -j, --jobs N        Max parallel jobs (default: 3)
  -s, --scenario TYPE Scenario type: article, research, email (default: article)
  -T, --timeout SEC   Timeout per topic in seconds (default: 300)
```

## Examples

### Basic Processing

```bash
./process_topics.sh
```

### High-Throughput Processing

```bash
./process_topics.sh -j 8 -T 600
```

### Research Articles

```bash
./process_topics.sh -s research -j 4
```

### Custom Files and Directories

```bash
./process_topics.sh -t custom_topics.txt -o research_papers
```

## Output Structure

### Generated Files

```
outputs/
├── topic_1.md          # Article for topic 1
├── topic_2.md          # Article for topic 2
└── ...

logs/
├── topic_1.log         # Detailed processing log for topic 1
├── topic_2.log         # Detailed processing log for topic 2
├── processing_summary.log  # Overall summary
└── ...
```

### Markdown File Format

Each generated file includes:

- **Metadata**: Generation date, topic number, workflow type
- **Article Content**: Complete, publication-ready article
- **Processing Reference**: Link to detailed processing log

## Monitoring and Troubleshooting

### Real-Time Monitoring

The script provides colorized output showing:

- 🔄 Topics being processed
- ✅ Successful completions
- ❌ Failed topics
- 📊 Progress statistics

### Log Analysis

- **Individual Topic Logs**: `logs/topic_N.log`
- **Summary Report**: `logs/processing_summary.log`
- **API Requests/Responses**: Detailed in topic logs

### Common Issues

#### Server Not Running

```
❌ Server not running at http://localhost:3002
💡 Please start the server with: node api-server-v4.cjs
```

#### API Rate Limits

- Reduce parallel jobs: `-j 2`
- Increase timeout: `-T 600`

#### Invalid Topics Format

```
❌ No numbered topics found in topics.txt
💡 Format should be: 1. Topic Name
```

## Performance Optimization

### Parallel Jobs Configuration

- **Conservative**: `-j 2` (safe for most systems)
- **Balanced**: `-j 3` (default)
- **Aggressive**: `-j 5+` (requires good hardware and API limits)

### Timeout Settings

- **Quick articles**: `-T 180` (3 minutes)
- **Standard**: `-T 300` (5 minutes, default)
- **Complex research**: `-T 600` (10 minutes)

## Advanced Usage

### Custom Scenario Types

#### Research Papers

```bash
./process_topics.sh -s research -T 600 -j 2
```

#### Email Responses

```bash
./process_topics.sh -s email -T 120 -j 5
```

### Batch Processing Multiple Topic Files

```bash
for file in topics_*.txt; do
    ./process_topics.sh -t "$file" -o "outputs_$(basename "$file" .txt)"
done
```

### Integration with CI/CD

```bash
# In your CI pipeline
./process_topics.sh -j 1 -T 300 || exit 1
```

## Quality Assurance

### Validation Pipeline

1. **Multi-Model Cross-Validation**: 4 AI models validate sources
2. **Google Search Grounding**: Real-world source verification
3. **Invalid Source Removal**: Automatic cleanup of unreliable content
4. **Final Quality Check**: Claude's comprehensive review

### Success Metrics

- **Source Validation**: All sources verified through Google search
- **Multi-Model Agreement**: Cross-validation across AI models
- **Error Rate**: Typically <5% failure rate
- **Processing Time**: ~3-5 minutes per topic

## Troubleshooting Guide

### Script Won't Start

1. Check file permissions: `chmod +x process_topics.sh`
2. Verify server is running: `curl http://localhost:3002/api/health`
3. Check topics file format

### High Failure Rate

1. Check API keys in `.env` file
2. Verify internet connectivity
3. Reduce parallel jobs
4. Increase timeout

### Memory Issues

1. Reduce parallel jobs: `-j 2`
2. Monitor system resources
3. Check log file sizes

## Support

For issues or questions:

1. Check the processing logs in `logs/`
2. Review the summary report
3. Verify API server health
4. Check system resources

## License

Part of AI Ping-Pong Studio v4 - See main project license.
