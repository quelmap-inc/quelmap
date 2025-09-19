# quelmap - Open Source Local Data Analysis Assistant.

![preview](.assets/preview.gif)

# Key Features

- 📊 Data visualization    
-  🚀 Table joins
-  📈 Run statistical tests directly on your dataset
-  📂 Unlimited rows, 30+ tables analyzed simultaneously
-  🐍 Built-in python sandbox
-  🦙 Ollama integration
and more..

16GB RAM is enough for practical performance using [Lightning-4b](https://quelmap.com/lightning-4b)

# Quick Start

Introduce you how to run **quelmap** on your machine.

1. Ensure Docker is installed and running on your system.

2. Clone the quelmap repository:
```bash
git clone https://github.com/quelmap-inc/quelmap.git
```

3. After cloning, navigate to the directory containing the project files.
```bash
cd quelmap
```

4. Start the application
```bash
docker compose up --build -d
```
This command sets up 3 containers(Application, Python Sandbox, PostgresDB). Wait for starting up all containers, Access "http://localhost:3030".
You can use any LLM provider’s model by setting the base_url and api_key from the settings icon in the top right (by default, Ollama is used).
- ollama (default)
- llama.cpp
- LM Studio
- vllm
- OpenAI
- Anthropic
- Groq
(If you don't know what is base_url and api_key, please google "(Provider Name such as llama.cpp) openai compatible")

If you set an LLM provider such as OpenAI or Groq, your dataset schema will be sent. If you want to run everything completely locally, please proceed to the LLM setup steps below.


### LLM Setup
5. Install ollama (Skip if you already installed)
https://ollama.com/

6. Download model (Lightning-4b)
![lightning-logo](.assets/lightning-logo.svg)

Lightning-4b is lightweight model specially trained to use in quelmap. This model offers greater stability than models with 50 times more parameters in common analytical tasks.
[Detail of Lightning 4b training and performance](https://quelmap.com/lightning-4b)


- Laptop (ex. mac book air 16GB) - 4bit Quantization + 10240 Context Window
```
ollama pull hf.co/quelmap/Lightning-4b-GGUF-short-ctx:Q4_K_M
```
- Gaming Laptop - 4bit Quantization + 40960 Context Window
```
ollama pull hf.co/quelmap/Lightning-4b-GGUF:Q4_K_M
```
- Powerful PC with GPU - No Quantization + 40960 Context Window
```
ollama pull hf.co/quelmap/Lightning-4b-GGUF:F16
```


(You can use another model like qwen3-next if you have enough GPU.)

If you feel response is too slow, add "/no_think" or "Do not think." in your query and It will generate python code immediately. 

After downloading the model, hit reload button on your browser and you can choose the model in UI. If no model appeared, check ollama port is 11434. If not, modify port of base_url from the settings icon in the top right.



### Sample Dataset & Query
For those who don’t have data on hand to analyze, we’ve prepared a sample dataset to try out **quelmap**. Please download the CSV file from this link below and upload it using the **“new tables”** button.
[employee-attrition-dataset](https://quelmap.com/sample_dataset)

Sample queries:
1. Create a **scatter plot** of **Age** versus **Total Working Years**.
2. Use a **Chi-square test** to examine whether there is a difference in **business travel frequency** between **single and married employees**.
3. Visualize the relationship between **Performance Rating** and **Number of Training Sessions attended last year**.
4. Use a **boxplot** to show the relationship between **Attrition** and **Monthly Income**, and check whether employees who left tend to have lower monthly income.
5. Analyze the correlation between **Relationship Satisfaction with Manager** and **Years with Current Manager**.
6. Perform a **t-test** to test whether there is a difference in **Job Satisfaction** between employees who have worked at **one or more previous companies** and those who have worked at **none**.

### Uploadable data type
Following type of data can be uploaded from web UI.
- CSV file
- EXCEL file
- SQlite db file

Once you upload files, the data will be converted into data table and stored in container volume.

### Connect to Database with connection string (Preview)
Normally, uploaded data is stored in the volume of the Postgres container, but you can also execute SQL directly against an external database. A connection string with read permissions is required. (Since unexpected changes may occur, it is recommended to use a user with read-only permissions.)

1. Stop containers if running
```bash
docker compose down -v
```
2. Set connection string in .env file
```bash
echo "USER_DATABASE_URL=postgresql://postgres:mysecretpassword@localhost:5432/mydatabase" >> .env
```
3. Start container
```bash
docker compose up --build -d
```

## Contribution
 If you find bugs or have ideas, please share them in via GitHub Issues. For more information on contributing to quelmap you can read the [CONTRIBUTING.md](CONTRIBUTING.md) file to learn more about quelmap and how you can contribute to it.
