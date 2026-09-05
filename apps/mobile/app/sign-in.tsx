import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { isConfigured } from '@/lib/supabase';
import { colors, radius, spacing } from '@/lib/theme';

export default function SignInScreen() {
  const router = useRouter();
  const { sendCode, verifyCode } = useAuth();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSend() {
    setError(null);
    if (!email.includes('@')) {
      setError('Enter a valid email');
      return;
    }
    setBusy(true);
    try {
      await sendCode(email.trim());
      setStep('code');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send code');
    } finally {
      setBusy(false);
    }
  }

  async function onVerify() {
    setError(null);
    setBusy(true);
    try {
      await verifyCode(email.trim(), code.trim());
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid code');
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Sign in to Lynkkii</Text>
        <Text style={styles.subtitle}>
          {step === 'email'
            ? 'We’ll email you a 6-digit code — no password needed.'
            : `Enter the code we sent to ${email}.`}
        </Text>

        {!isConfigured ? (
          <Text style={styles.error}>Supabase is not configured yet.</Text>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {step === 'email' ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
            />
            <Pressable style={styles.btn} onPress={onSend} disabled={busy}>
              {busy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.btnText}>Send code</Text>}
            </Pressable>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="123456"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              value={code}
              onChangeText={setCode}
              maxLength={6}
            />
            <Pressable style={styles.btn} onPress={onVerify} disabled={busy}>
              {busy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.btnText}>Verify & sign in</Text>}
            </Pressable>
            <Pressable onPress={() => setStep('email')}>
              <Text style={styles.link}>Use a different email</Text>
            </Pressable>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center' },
  card: { padding: spacing.xl, gap: spacing.md },
  title: { fontSize: 24, fontWeight: '800', color: colors.ink },
  subtitle: { color: colors.muted, fontSize: 15, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 18,
    color: colors.ink,
  },
  btn: { backgroundColor: colors.green, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  btnText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  link: { color: colors.greenDark, fontWeight: '600', textAlign: 'center', marginTop: spacing.sm },
  error: { color: '#B3261E', fontWeight: '600' },
});
