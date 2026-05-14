import { useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as Speech from 'expo-speech';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type ReferenceTime = {
  id: string;
  label: string;
  durationSeconds: number;
};

const REFERENCE_TIMES: ReferenceTime[] = [
  { id: 'ref-5', label: '5:00 Minuten', durationSeconds: 5 * 60 },
  { id: 'ref-10', label: '10:00 Minuten', durationSeconds: 10 * 60 },
  { id: 'ref-15', label: '15:00 Minuten', durationSeconds: 15 * 60 },
  { id: 'ref-20', label: '20:00 Minuten', durationSeconds: 20 * 60 },
];

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function getAnnouncement(previousSeconds: number, currentSeconds: number): string | null {
  if (currentSeconds === previousSeconds) {
    return null;
  }

  if (currentSeconds <= 0) {
    return 'Start';
  }

  if (currentSeconds <= 60) {
    for (const threshold of [50, 40, 30, 20, 10]) {
      if (previousSeconds > threshold && currentSeconds <= threshold) {
        return `Noch ${threshold} Sekunden`;
      }
    }
    return null;
  }

  const previousMinutes = Math.floor(previousSeconds / 60);
  const currentMinutes = Math.floor(currentSeconds / 60);

  if (previousMinutes > currentMinutes) {
    return currentMinutes === 1 ? 'Noch 1 Minute' : `Noch ${currentMinutes} Minuten`;
  }

  return null;
}

export default function App() {
  const [activeReferenceId, setActiveReferenceId] = useState<string | null>(null);
  const [targetTimestamp, setTargetTimestamp] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  const activeReference = useMemo(
    () => REFERENCE_TIMES.find((item) => item.id === activeReferenceId) ?? null,
    [activeReferenceId],
  );

  useEffect(() => {
    if (targetTimestamp === null) {
      return;
    }

    const interval = setInterval(() => {
      const nextSeconds = Math.max(0, Math.ceil((targetTimestamp - Date.now()) / 1000));

      setRemainingSeconds((previousSeconds) => {
        const announcement = getAnnouncement(previousSeconds, nextSeconds);
        if (announcement) {
          Speech.speak(announcement, { language: 'de-DE' });
        }
        return nextSeconds;
      });

      if (nextSeconds === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [targetTimestamp]);

  const handleStart = (reference: ReferenceTime) => {
    const now = Date.now();
    setActiveReferenceId(reference.id);
    setRemainingSeconds(reference.durationSeconds);
    setTargetTimestamp(now + reference.durationSeconds * 1000);
  };

  const handleReset = () => {
    setTargetTimestamp(null);
    setActiveReferenceId(null);
    setRemainingSeconds(0);
    Speech.stop();
  };

  const isRunning = targetTimestamp !== null && remainingSeconds > 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Segeluhr</Text>
      {!isRunning ? (
        <View style={styles.selectionContainer}>
          <Text style={styles.subtitle}>Referenzzeit wählen</Text>
          {REFERENCE_TIMES.map((reference) => (
            <Pressable key={reference.id} style={styles.button} onPress={() => handleStart(reference)}>
              <Text style={styles.buttonLabel}>{reference.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.countdownContainer}>
          <Text style={styles.subtitle}>{activeReference?.label ?? 'Countdown'}</Text>
          <Text style={styles.countdown}>{formatTime(remainingSeconds)}</Text>
          <Pressable style={styles.button} onPress={handleReset}>
            <Text style={styles.buttonLabel}>Stoppen</Text>
          </Pressable>
        </View>
      )}
      {targetTimestamp !== null && remainingSeconds === 0 ? (
        <View style={styles.finishedContainer}>
          <Text style={styles.finishedText}>Start!</Text>
          <Pressable style={styles.button} onPress={handleReset}>
            <Text style={styles.buttonLabel}>Neu starten</Text>
          </Pressable>
        </View>
      ) : null}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fbff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 24,
    color: '#0d2b45',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 12,
    color: '#214d72',
    textAlign: 'center',
  },
  selectionContainer: {
    width: '100%',
    maxWidth: 320,
    gap: 12,
  },
  countdownContainer: {
    alignItems: 'center',
  },
  countdown: {
    fontSize: 72,
    fontWeight: '700',
    color: '#0d2b45',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#0d6efd',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  buttonLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  finishedContainer: {
    marginTop: 20,
    alignItems: 'center',
    gap: 10,
  },
  finishedText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#198754',
  },
});
