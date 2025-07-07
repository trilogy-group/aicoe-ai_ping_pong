#!/bin/bash

# AI Ping-Pong Studio v4 - Automated Topic Processing Script
# Processes topics from topics.txt and generates markdown files in outputs folder
# Features: Parallel processing, error isolation, comprehensive logging

set -euo pipefail

# Configuration
TOPICS_FILE="topics.txt"
OUTPUT_DIR="outputs"
LOG_DIR="logs"
API_BASE="http://localhost:3002"
MAX_PARALLEL_JOBS=3  # Adjust based on system resources and API limits
TIMEOUT_SECONDS=300  # 5 minutes timeout per topic
SCENARIO_TYPE="article"  # Can be changed to "research" or "email"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Global variables
TOTAL_TOPICS=0
COMPLETED_TOPICS=0
FAILED_TOPICS=0
PIDS=()  # Initialize as empty array

# Create necessary directories
setup_directories() {
    echo -e "${BLUE}🚀 Setting up directories...${NC}"
    mkdir -p "$OUTPUT_DIR" "$LOG_DIR"
    
    # Clean up old logs
    if [ -d "$LOG_DIR" ]; then
        rm -f "$LOG_DIR"/*.log
    fi
    
    echo -e "${GREEN}✅ Directories ready${NC}"
}

# Check if server is running
check_server() {
    echo -e "${BLUE}🔍 Checking server status...${NC}"
    
    if ! curl -s "$API_BASE/api/health" > /dev/null; then
        echo -e "${RED}❌ Server not running at $API_BASE${NC}"
        echo -e "${YELLOW}💡 Please start the server with: node api-server-v4.cjs${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Server is running${NC}"
}

# Read and validate topics file
read_topics() {
    echo -e "${BLUE}📖 Reading topics from $TOPICS_FILE...${NC}"
    
    if [ ! -f "$TOPICS_FILE" ]; then
        echo -e "${RED}❌ Topics file not found: $TOPICS_FILE${NC}"
        exit 1
    fi
    
    # Count non-empty lines
    TOTAL_TOPICS=$(grep -c '^[0-9]' "$TOPICS_FILE" || echo "0")
    
    if [ "$TOTAL_TOPICS" -eq 0 ]; then
        echo -e "${RED}❌ No numbered topics found in $TOPICS_FILE${NC}"
        echo -e "${YELLOW}💡 Format should be: 1. Topic Name${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Found $TOTAL_TOPICS topics${NC}"
}

# JSON escaping function
escape_json() {
    local input="$1"
    # Use jq to properly escape JSON string
    echo "$input" | jq -Rs .
}

# Process a single topic
process_topic() {
    local topic_num=$1
    local topic_text=$2
    local log_file="$LOG_DIR/topic_${topic_num}.log"
    local output_file="$OUTPUT_DIR/topic_${topic_num}.md"
    
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Starting processing for topic $topic_num" >> "$log_file"
    echo "Topic: $topic_text" >> "$log_file"
    
    # Workflow steps configuration - using jq to build JSON safely
    local steps=(
        '{"id":"clarify-brief","model":"gpt","title":"Brief Clarification"}'
        '{"id":"deep-research","model":"gemini","title":"Deep Research"}'
        '{"id":"first-draft","model":"gpt","title":"First Draft"}'
        '{"id":"logical-enhancement","model":"claude","title":"Logical Enhancement"}'
        '{"id":"creative-polish","model":"gpt","title":"Creative Polish"}'
        '{"id":"multi-model-source-validation","model":"all-models","title":"Multi-Model Source Validation"}'
        '{"id":"google-search-validation","model":"google-search","title":"Google Search Validation"}'
        '{"id":"final-source-verification","model":"claude","title":"Final Source Verification"}'
        '{"id":"production-ready","model":"gpt","title":"Production Ready"}'
    )
    
    # Workflow step prompts - updated for full Substack article creation with VP perspective
    local step_prompts=(
        "Analyze this topic for a compelling Substack article from the perspective of a VP of AI Center of Excellence: '${topic_text}'. Define the CORE ANGLE and HOOK that will grab readers immediately. What's the controversial or surprising insight from an AI leadership perspective? What strong, spiky opinion or contrarian view can we take that only someone deep in AI strategy would know? Provide: 1) Main thesis/argument from VP lens 2) Target audience (AI leaders, executives, practitioners) 3) Key hook/angle with insider perspective 4) 3-5 main sections the article should cover 5) Strong, spiky opinion or contrarian take that will spark engagement among AI professionals."
        
        "Research this topic comprehensively for a full Substack article from a VP of AI Center of Excellence perspective. Find: 1) RECENT statistics and data (last 6 months) relevant to AI strategy 2) Expert quotes from AI leaders and contrarian opinions 3) Real-world enterprise AI examples and case studies 4) Industry trends and predictions that affect AI strategy 5) Controversial aspects or debates in AI leadership circles 6) Surprising facts that most people don't know about AI implementation. Focus on finding material that supports a strong, spiky take from an AI executive's viewpoint. Include ALL sources with proper citations."
        
        "Write a COMPLETE, FULL-LENGTH Substack article (1500-2500 words minimum) from the perspective of a VP of AI Center of Excellence. Include: 1) COMPELLING HOOK - Start with a story, surprising stat, or bold statement from AI leadership experience 2) CLEAR THESIS - State your strong, spiky opinion early as an AI executive 3) COMPREHENSIVE BODY - Multiple detailed sections with ## h2 subheadings in markdown 4) EVIDENCE INTEGRATION - Weave in all research naturally with insider AI perspective 5) SPIKY VP TAKES - Add opinionated commentary throughout from AI leadership viewpoint 6) ENGAGING CONCLUSION - Strong call-to-action for AI leaders. Format the ENTIRE article in proper markdown with ## for all section headings. Write as a VP sharing insider knowledge and controversial takes."
        
        "Enhance this article's logical structure and flow while maintaining the VP of AI Center of Excellence perspective. Ensure: 1) Each section builds logically to the next 2) Smooth transitions between ideas 3) Strong argument progression from AI leadership angle 4) Clear evidence supporting each claim 5) Compelling narrative thread throughout 6) ## h2 subheadings that grab attention and reflect VP insights. Maintain the full article length, markdown formatting, and strengthen the logical backbone while keeping spiky AI executive takes."
        
        "Polish this article for maximum Substack engagement while preserving the VP of AI Center of Excellence voice. Add: 1) More compelling hooks and attention-grabbers from AI leadership experience 2) Stronger, spikier opinions and contrarian takes that only an AI executive would share 3) Better storytelling elements with insider AI examples 4) More conversational, engaging tone while maintaining executive authority 5) Strategic use of **bold text** and emphasis in markdown 6) Compelling ## h2 subheadings 7) Strong 'So What?' conclusion section for AI leaders. Ensure the article is publication-ready, maintains full length, and is formatted in proper markdown."
        
        "Validate all sources and claims in this full article from the VP perspective. Cross-check facts, verify statistics relevant to AI strategy, and identify any questionable claims. Provide detailed assessment of source reliability for AI leadership context."
        
        "Use Google search to validate all sources and claims. Remove any that cannot be verified, but preserve the article's full length, VP perspective, spiky takes, and markdown formatting."
        
        "Review validation results and clean the article of any unverified claims while maintaining its full substance, argumentative power, VP perspective, and markdown formatting with ## h2 headings."
        
        "DELIVER the complete, final, publication-ready Substack article in MARKDOWN format from a VP of AI Center of Excellence perspective. This must be the FULL ARTICLE ready for immediate publication with: 1) Compelling title 2) Engaging hook opening from AI leadership experience 3) Clear thesis with strong, spiky opinions as an AI executive 4) Multiple detailed sections with ## h2 subheadings in markdown 5) Evidence and examples throughout with insider AI perspective 6) Strong 'So What?' conclusion for AI leaders 7) 1500-2500 words minimum 8) ALL formatting in proper markdown. Start immediately with the title and article content in markdown. NO meta-commentary or explanations."
    )
    
    local step_outputs=()
    
    # Process each step
    for i in "${!steps[@]}"; do
        local step_num=$((i + 1))
        local step_json="${steps[$i]}"
        local step_prompt="${step_prompts[$i]}"
        
        echo "$(date '+%Y-%m-%d %H:%M:%S') - Step $step_num: Processing..." >> "$log_file"
        
        # Build step JSON with prompt using jq for safe construction
        local step_with_prompt=$(echo "$step_json" | jq --arg prompt "$step_prompt" '. + {rawPrompt: $prompt}')
        
        # Build context with previous step outputs using jq for safe JSON construction
        local step_outputs_json="[]"
        if [ ${#step_outputs[@]} -gt 0 ]; then
            step_outputs_json=$(printf '%s\n' "${step_outputs[@]}" | jq -Rs 'split("\n")[:-1]')
        fi
        
        local current_context=$(jq -n \
            --arg userInput "$topic_text" \
            --argjson stepOutputs "$step_outputs_json" \
            '{userInput: $userInput, stepOutputs: $stepOutputs}')
        
        # Add validation context if available
        if [ -n "${validation_results:-}" ]; then
            current_context=$(echo "$current_context" | jq --arg validationResults "$validation_results" '. + {validationResults: $validationResults}')
        fi
        if [ -n "${google_search_context:-}" ]; then
            current_context=$(echo "$current_context" | jq --argjson googleSearchValidation "$google_search_context" '. + {googleSearchValidation: $googleSearchValidation}')
        elif [ -n "${google_search_results:-}" ]; then
            current_context=$(echo "$current_context" | jq --arg googleSearchValidation "$google_search_results" '. + {googleSearchValidation: $googleSearchValidation}')
        fi
        
        # Make API request with properly constructed JSON
        local request_data=$(jq -n \
            --argjson step "$step_with_prompt" \
            --argjson context "$current_context" \
            --arg scenarioId "$SCENARIO_TYPE" \
            '{step: $step, context: $context, scenarioId: $scenarioId}')
        
        echo "Request: $request_data" >> "$log_file"
        
        local response
        if response=$(curl -s -X POST "$API_BASE/api/run" \
            -H "Content-Type: application/json" \
            -d "$request_data" \
            --max-time "$TIMEOUT_SECONDS" 2>> "$log_file"); then
            
            echo "Response: $response" >> "$log_file"
            
            # Parse response
            if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
                local result
                result=$(echo "$response" | jq -r '.result')
                step_outputs+=("$result")
                
                echo "$(date '+%Y-%m-%d %H:%M:%S') - Step $step_num: Success (${#result} chars)" >> "$log_file"
                
                # Store special results for context
                if [[ "$step_json" == *"multi-model-source-validation"* ]]; then
                    validation_results="$result"
                fi
                if [[ "$step_json" == *"google-search-validation"* ]]; then
                    google_search_results="$result"
                    # Check if context data is available
                    if echo "$response" | jq -e '.contextData.googleSearchValidation' > /dev/null 2>&1; then
                        google_search_context=$(echo "$response" | jq -c '.contextData.googleSearchValidation')
                        echo "$(date '+%Y-%m-%d %H:%M:%S') - Step $step_num: Context data captured" >> "$log_file"
                    fi
                fi
                
            else
                local error_msg
                error_msg=$(echo "$response" | jq -r '.error // "Unknown error"')
                echo "$(date '+%Y-%m-%d %H:%M:%S') - Step $step_num: Failed - $error_msg" >> "$log_file"
                return 1
            fi
        else
            echo "$(date '+%Y-%m-%d %H:%M:%S') - Step $step_num: API request failed" >> "$log_file"
            return 1
        fi
        
        # Brief pause between steps
        sleep 1
    done
    
    # Save final result to markdown file
    if [ ${#step_outputs[@]} -gt 0 ]; then
        local final_output="${step_outputs[${#step_outputs[@]}-1]}"
        
        # Create markdown file with metadata
        cat > "$output_file" << EOF
# $topic_text

**Generated:** $(date '+%Y-%m-%d %H:%M:%S')
**Topic Number:** $topic_num
**Workflow:** $SCENARIO_TYPE
**Status:** Completed Successfully

---

$final_output

---

**Processing Log:** See \`$log_file\` for detailed processing information.
EOF
        
        echo "$(date '+%Y-%m-%d %H:%M:%S') - Topic $topic_num: Completed successfully" >> "$log_file"
        echo "$(date '+%Y-%m-%d %H:%M:%S') - Output saved to: $output_file" >> "$log_file"
        
        return 0
    else
        echo "$(date '+%Y-%m-%d %H:%M:%S') - Topic $topic_num: No output generated" >> "$log_file"
        return 1
    fi
}

# Wrapper function for parallel processing
process_topic_wrapper() {
    local topic_num=$1
    local topic_text=$2
    
    echo -e "${BLUE}🔄 Processing Topic $topic_num: $topic_text${NC}"
    
    if process_topic "$topic_num" "$topic_text"; then
        echo -e "${GREEN}✅ Topic $topic_num: Completed successfully${NC}"
        ((COMPLETED_TOPICS++))
    else
        echo -e "${RED}❌ Topic $topic_num: Failed${NC}"
        ((FAILED_TOPICS++))
    fi
}

# Main processing function
process_all_topics() {
    echo -e "${BLUE}🚀 Starting parallel processing of $TOTAL_TOPICS topics...${NC}"
    echo -e "${YELLOW}📊 Max parallel jobs: $MAX_PARALLEL_JOBS${NC}"
    
    local active_jobs=0
    local topic_num=1
    
    # Read topics and process them
    while IFS= read -r line; do
        # Skip empty lines and non-numbered lines
        if [[ ! "$line" =~ ^[0-9]+\. ]]; then
            continue
        fi
        
        # Extract topic text (remove number and dot)
        local topic_text=$(echo "$line" | sed 's/^[0-9]*\. *//')
        
        # Wait if we've reached max parallel jobs
        while [ $active_jobs -ge $MAX_PARALLEL_JOBS ]; do
            # macOS compatible job waiting
            local finished_jobs=0
            if [ ${#PIDS[@]} -gt 0 ]; then
                for pid in "${PIDS[@]}"; do
                    if ! kill -0 "$pid" 2>/dev/null; then
                        ((finished_jobs++))
                    fi
                done
            fi
            
            if [ $finished_jobs -gt 0 ]; then
                ((active_jobs--))
                break
            fi
            
            sleep 1  # Brief pause before checking again
        done
        
        # Start processing in background
        process_topic_wrapper "$topic_num" "$topic_text" &
        local pid=$!
        PIDS+=($pid)
        ((active_jobs++))
        ((topic_num++))
        
        echo -e "${YELLOW}🔄 Started Topic $((topic_num-1)) (PID: $pid)${NC}"
        
        # Brief pause to avoid overwhelming the system
        sleep 2
        
    done < "$TOPICS_FILE"
    
    # Wait for all remaining jobs to complete
    echo -e "${BLUE}⏳ Waiting for all topics to complete...${NC}"
    if [ ${#PIDS[@]} -gt 0 ]; then
        for pid in "${PIDS[@]}"; do
            if kill -0 "$pid" 2>/dev/null; then
                wait "$pid"
            fi
        done
    fi
}

# Generate summary report
generate_summary() {
    local summary_file="$LOG_DIR/processing_summary.log"
    
    echo "AI Ping-Pong Studio v4 - Processing Summary" > "$summary_file"
    echo "=============================================" >> "$summary_file"
    echo "Date: $(date '+%Y-%m-%d %H:%M:%S')" >> "$summary_file"
    echo "Total Topics: $TOTAL_TOPICS" >> "$summary_file"
    echo "Completed: $COMPLETED_TOPICS" >> "$summary_file"
    echo "Failed: $FAILED_TOPICS" >> "$summary_file"
    echo "Success Rate: $(( COMPLETED_TOPICS * 100 / TOTAL_TOPICS ))%" >> "$summary_file"
    echo "" >> "$summary_file"
    
    echo "Generated Files:" >> "$summary_file"
    echo "===============" >> "$summary_file"
    for file in "$OUTPUT_DIR"/*.md; do
        if [ -f "$file" ]; then
            echo "- $(basename "$file")" >> "$summary_file"
        fi
    done
    
    echo "" >> "$summary_file"
    echo "Log Files:" >> "$summary_file"
    echo "==========" >> "$summary_file"
    for file in "$LOG_DIR"/*.log; do
        if [ -f "$file" ] && [ "$(basename "$file")" != "processing_summary.log" ]; then
            echo "- $(basename "$file")" >> "$summary_file"
        fi
    done
    
    # Display summary
    echo -e "${BLUE}📊 Processing Summary:${NC}"
    echo -e "${GREEN}✅ Completed: $COMPLETED_TOPICS/$TOTAL_TOPICS${NC}"
    echo -e "${RED}❌ Failed: $FAILED_TOPICS/$TOTAL_TOPICS${NC}"
    echo -e "${YELLOW}📄 Summary saved to: $summary_file${NC}"
}

# Cleanup function
cleanup() {
    echo -e "${YELLOW}🧹 Cleaning up background processes...${NC}"
    if [ ${#PIDS[@]} -gt 0 ]; then
        for pid in "${PIDS[@]}"; do
            if kill -0 "$pid" 2>/dev/null; then
                kill "$pid" 2>/dev/null || true
            fi
        done
    fi
}

# Signal handlers
trap cleanup EXIT
trap 'echo -e "${RED}❌ Interrupted by user${NC}"; cleanup; exit 1' INT TERM

# Main execution
main() {
    echo -e "${BLUE}🎯 AI Ping-Pong Studio v4 - Automated Topic Processing${NC}"
    echo -e "${BLUE}=======================================================${NC}"
    
    setup_directories
    check_server
    read_topics
    
    local start_time=$(date +%s)
    
    process_all_topics
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    generate_summary
    
    echo -e "${BLUE}⏱️  Total processing time: ${duration}s${NC}"
    
    if [ $FAILED_TOPICS -eq 0 ]; then
        echo -e "${GREEN}🎉 All topics processed successfully!${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠️  Some topics failed. Check logs for details.${NC}"
        exit 1
    fi
}

# Help function
show_help() {
    cat << EOF
AI Ping-Pong Studio v4 - Automated Topic Processing

Usage: $0 [OPTIONS]

Options:
  -h, --help          Show this help message
  -t, --topics FILE   Specify topics file (default: topics.txt)
  -o, --output DIR    Specify output directory (default: outputs)
  -j, --jobs N        Max parallel jobs (default: 3)
  -s, --scenario TYPE Scenario type: article, research, email (default: article)
  -T, --timeout SEC   Timeout per topic in seconds (default: 300)

Examples:
  $0                           # Process with defaults
  $0 -j 5 -s research         # Use 5 parallel jobs, research scenario
  $0 -t my_topics.txt -o docs  # Custom topics file and output directory

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -t|--topics)
            TOPICS_FILE="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        -j|--jobs)
            MAX_PARALLEL_JOBS="$2"
            shift 2
            ;;
        -s|--scenario)
            SCENARIO_TYPE="$2"
            shift 2
            ;;
        -T|--timeout)
            TIMEOUT_SECONDS="$2"
            shift 2
            ;;
        *)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Run main function
main 