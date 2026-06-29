import {
  FullConfig,
  Reporter,
  Suite,
  TestCase,
  TestResult,
  TestStep,
} from '@playwright/test/reporter';

export interface stepLog {
  snippet?: string;
  stack?: string;
  title: string;
  output?: string;
}

class cliReporterWithSteps implements Reporter {
  onBegin(config: FullConfig, suite: Suite) {
    const totalTests = suite.allTests().length;
    console.log(`\nRunning ${totalTests} test${totalTests !== 1 ? 's' : ''} using ${config.workers} worker${config.workers !== 1 ? 's' : ''}\n`);
  }

  onTestBegin(test) {
    console.log(`Starting test \x1B[1m${test.title}\x1b[0m \n`);
  }
  steps = [];
  private currentStepOutput: string[] = [];
  private inStep = false;

  onStepBegin(test: TestCase, result: TestResult, step: TestStep): void {
    if (step.category === 'test.step') {
      this.inStep = true;
      this.currentStepOutput = [];
    }
  }

  onStepEnd(test: TestCase, result: TestResult, step: TestStep): void {
    if (step.category === 'test.step') {
      const stepLog = this.createTestStep(step);
      if (stepLog) {
        stepLog.output = this.currentStepOutput.join('');
      }
      this.steps.push(stepLog);
      this.inStep = false;
      this.currentStepOutput = [];
    }
  }

  onStdOut(chunk: string | Buffer): void {
    const text = typeof chunk === 'string' ? chunk : chunk.toString();
    if (this.inStep) {
      this.currentStepOutput.push(text);
    } else {
      process.stdout.write(text);
    }
  }

  onStdErr(chunk: string | Buffer): void {
    const text = typeof chunk === 'string' ? chunk : chunk.toString();
    if (this.inStep) {
      this.currentStepOutput.push(text);
    } else {
      process.stderr.write(text);
    }
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    this.printTestStep(this.steps);
    const duration = result.duration / 1000;
    if (result.status === 'passed') {
      console.log(
        `\n \x1B[1mTest \x1b[32m${result.status}\x1b[0m in ${duration}s \n`,
      );
    } else {
      console.log(
        `\n \x1B[1mTest \x1b[31m${result.status}\x1b[0m in ${duration}s \n`,
      );
    }
  }

  createTestStep(step) {
    if (step.category === 'test.step') {
      const duration = step.duration / 1000;
      if (step.error) {
        return {
          title: `${step.title} \x1b[31mfailed\x1b[0m ${duration}s\n`,
          stack: `${step.error.stack} \n`,
          snippet: `${step.error.snippet}`,
        };
      } else {
        return {
          title: `${step.title} \x1b[32msuccess\x1b[0m ${duration}s`,
        };
      }
    }
  }

  printTestStep(steps: [stepLog]) {
    if (!steps) {
      return;
    }
    let index = 1;
    steps.forEach((item) => {
      console.log(`${index++}.` + item.title);
      if (item.output) {
        process.stdout.write(item.output);
      }
      if (item.stack) {
        console.log(item.stack);
      }
      if (item.snippet) {
        console.log(item.snippet);
      }
    });
  }

  printsToStdio() {
    return true;
  }
}

export default cliReporterWithSteps;
