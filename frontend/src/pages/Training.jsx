import { useState } from 'react'
import { playSafeChime, playThreatAlert } from '../utils/audio'
import styles from './Training.module.css'

const SCENARIOS = [
  {
    id: 1,
    title: 'Scenario 1: Password expiration notice',
    sender: 'IT-Helpdesk <security-update@m1crosoft-auth-portal.com>',
    subject: 'Action required: Microsoft 365 password expiring',
    content: `Dear employee,
Your organizational password for user@company.com is scheduled to expire in 2 hours.
Please verify your identity to maintain VPN access.

http://login.microsoftonline.com.account-verification-portal.tk/auth

IT Security Team`,
    isPhishing: true,
    explanation: 'Phishing lure. The sender uses a typosquatted domain ("m1crosoft-auth-portal.com") and redirects to a free top-level domain (.tk) masquerading as Microsoft.'
  },
  {
    id: 2,
    title: 'Scenario 2: Repository security advisory',
    sender: 'GitHub <notifications@github.com>',
    subject: '[repo] Security vulnerability detected in dependency',
    content: `A vulnerability was detected in a repository you contribute to.

Vulnerability: Prototype Pollution in axios < 1.6.0
Severity: High (CVSS 7.5)

Review advisory and pull request at:
https://github.com/username/repo/security/dependabot/1

GitHub Security Team`,
    isPhishing: false,
    explanation: 'Legitimate notification. Sent from the verified github.com domain with direct repository links and standard security advisory structure.'
  },
  {
    id: 3,
    title: 'Scenario 3: Wire transfer request',
    sender: 'David Vance <ceo.office.vance@gmail.com>',
    subject: 'Confidential vendor settlement wire before 4 PM',
    content: `Are you at your desk right now?
I am in a meeting with the board and cannot take calls. We need to wire $48,500 to the attached vendor escrow account today.

Do not discuss this externally as it is covered under strict NDA. Send the receipt once complete.

David Vance`,
    isPhishing: true,
    explanation: 'Phishing lure. Typical business email compromise (BEC): uses an external Gmail address impersonating executive leadership, artificial urgency, and secrecy instructions.'
  },
  {
    id: 4,
    title: 'Scenario 4: Order confirmation dispute',
    sender: 'Apple Billing <orders@apple-invoice-verification.xyz>',
    subject: 'Invoice for purchase: MacBook Pro M3 ($2,499.00)',
    content: `Thank you for your order with Apple.
We have charged $2,499.00 to your card on file.

If you did not authorize this purchase, dispute the transaction at:
http://appleid.apple.com.secure-cancellation-dispute.xyz/login

Apple Support`,
    isPhishing: true,
    explanation: 'Phishing lure. Fake invoice designed to incite panic over an unauthorized charge, directing users to a credential harvester on a suspicious domain.'
  },
  {
    id: 5,
    title: 'Scenario 5: Annual benefits open enrollment',
    sender: 'Human Resources <hr-benefits@company.internal.net>',
    subject: 'Annual benefits open enrollment reminder',
    content: `Hello team,
A reminder that open enrollment for your health and dental plans closes this Friday at 5:00 PM.
You can review plan selections in Workday:

https://workday.company.internal.net/benefits/enrollment

Contact HR at extension 4401 with any questions.`,
    isPhishing: false,
    explanation: 'Legitimate internal communication. Links point to company intranet hostnames and provide standard internal contact options.'
  }
]

export default function Training() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [score, setScore] = useState(0)
  const [completed, setCompleted] = useState(false)

  const currentScenario = SCENARIOS[currentIndex]

  function handleAnswer(guessIsPhish) {
    if (selectedAnswer !== null) return
    const isCorrect = guessIsPhish === currentScenario.isPhishing
    setSelectedAnswer({ guess: guessIsPhish, isCorrect })

    if (isCorrect) {
      setScore(prev => prev + 1)
      playSafeChime()
    } else {
      playThreatAlert()
    }
  }

  function handleNext() {
    if (currentIndex < SCENARIOS.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
    } else {
      setCompleted(true)
    }
  }

  function handleRestart() {
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setScore(0)
    setCompleted(false)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Security training</span>
          <h1 className={styles.title}>Phishing detection lab</h1>
          <p className={styles.subtitle}>
            Practice evaluating deceptive email lures and benign communications against real-world indicators.
          </p>
        </div>
        <div className={styles.scorePill}>
          <span className={styles.scoreLabel}>Score</span>
          <strong className={styles.scoreVal}>{score} / {SCENARIOS.length}</strong>
        </div>
      </div>

      {!completed ? (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.scenarioCount}>
              Case {currentIndex + 1} of {SCENARIOS.length}
            </span>
            <span className={styles.caseBadge}>Forensic review</span>
          </div>

          <div className={styles.emailContainer}>
            <div className={styles.metaLine}>
              <span className={styles.label}>From:</span>
              <span className={styles.value}>{currentScenario.sender}</span>
            </div>
            <div className={styles.metaLine}>
              <span className={styles.label}>Subject:</span>
              <span className={styles.value}>{currentScenario.subject}</span>
            </div>

            <div className={styles.emailBody}>
              <pre className={styles.preContent}>{currentScenario.content}</pre>
            </div>
          </div>

          {selectedAnswer === null ? (
            <div className={styles.decisionBar}>
              <button
                className={styles.phishBtn}
                onClick={() => handleAnswer(true)}
              >
                Flag as phishing
              </button>
              <button
                className={styles.legitBtn}
                onClick={() => handleAnswer(false)}
              >
                Mark as legitimate
              </button>
            </div>
          ) : (
            <div className={styles.feedbackArea}>
              <div
                className={`${styles.resultBanner} ${
                  selectedAnswer.isCorrect ? styles.correctBanner : styles.incorrectBanner
                }`}
              >
                <strong>
                  {selectedAnswer.isCorrect
                    ? 'Accurately identified'
                    : 'Misclassified lure'}
                </strong>
                <p>{currentScenario.explanation}</p>
              </div>

              <button className={styles.nextBtn} onClick={handleNext}>
                {currentIndex < SCENARIOS.length - 1 ? 'Next scenario →' : 'View final summary →'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.cardSummary}>
          <h2>Simulation complete</h2>
          <div className={styles.finalScore}>
            <strong>{score}</strong> / {SCENARIOS.length}
          </div>
          <p className={styles.summaryDesc}>
            {score >= 4
              ? 'Strong detection accuracy. Consistent identification of spoofed sender domains and artificial urgency signals.'
              : 'Review domain syntax, urgency language, and envelope headers to improve detection reflexes.'}
          </p>
          <button className={styles.restartBtn} onClick={handleRestart}>
            Restart training drill
          </button>
        </div>
      )}
    </div>
  )
}
