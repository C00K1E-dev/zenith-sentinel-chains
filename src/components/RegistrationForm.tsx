import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Check } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface RegistrationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletAddress: string;
  onSuccess: () => void;
  referralCode?: string; // REFERRAL: Optional referral code from URL
}

interface FormData {
  walletAddress: string;
  xHandle: string;
  telegramHandle: string;
}

interface ValidationErrors {
  xHandle?: string;
  telegramHandle?: string;
}

export function RegistrationForm({
  open,
  onOpenChange,
  walletAddress,
  onSuccess,
  referralCode, // REFERRAL: Extract referral code from props
}: RegistrationFormProps) {
  const [formData, setFormData] = useState<FormData>({
    walletAddress,
    xHandle: '',
    telegramHandle: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Validate X handle
    if (!formData.xHandle.trim()) {
      newErrors.xHandle = 'X handle is required';
    } else if (!formData.xHandle.match(/^@?[A-Za-z0-9_]{1,15}$/)) {
      newErrors.xHandle = 'Invalid X handle format';
    }

    // Validate Telegram handle (allow @ prefix like X handle)
    const telegramHandle = formData.telegramHandle.replace(/^@/, '');
    if (!formData.telegramHandle.trim()) {
      newErrors.telegramHandle = 'Telegram handle is required';
    } else if (!telegramHandle.match(/^[A-Za-z0-9_]{5,32}$/) && !telegramHandle.match(/^\d+$/)) {
      newErrors.telegramHandle = 'Invalid Telegram handle or user ID';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix all errors before submitting',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit to backend API
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      const response = await fetch(`${API_BASE_URL}/registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: formData.walletAddress,
          xHandle: formData.xHandle.startsWith('@') 
            ? formData.xHandle 
            : `@${formData.xHandle}`,
          telegramHandle: formData.telegramHandle,
          timestamp: Date.now(),
          referralCode: referralCode || null, // REFERRAL: Include referral code in API call
        }),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const data = await response.json();

      if (data.success) {
        setIsSubmitted(true);
        
        // Save to localStorage as backup
        const registrationData = {
          ...formData,
          submittedAt: new Date().toISOString(),
        };
        localStorage.setItem(
          `airdrop_registration_${formData.walletAddress}`,
          JSON.stringify(registrationData)
        );

        toast({
          title: 'Registration Successful! 🎉',
          description: 'Your registration has been saved. You are eligible to claim tokens on TGE!',
        });

        // Call onSuccess after a short delay
        setTimeout(() => {
          onSuccess();
          // Reset form
          setTimeout(() => {
            setIsSubmitted(false);
            setFormData({
              walletAddress,
              xHandle: '',
              telegramHandle: '',
            });
            onOpenChange(false);
          }, 1500);
        }, 1000);
      } else {
        throw new Error(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration Failed',
        description: error instanceof Error ? error.message : 'An error occurred during registration',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {!isSubmitted ? (
          <>
            <DialogHeader>
              <DialogTitle>Register for Airdrop</DialogTitle>
              <DialogDescription>
                Complete your registration to be eligible for SSTL token claim on TGE
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Wallet Address (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="walletAddress">Wallet Address</Label>
                <Input
                  id="walletAddress"
                  name="walletAddress"
                  value={formData.walletAddress}
                  disabled
                  className="bg-muted text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  This wallet will receive your SSTL tokens on TGE
                </p>
              </div>

              {/* X Handle */}
              <div className="space-y-2">
                <Label htmlFor="xHandle">
                  X Handle <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="xHandle"
                  name="xHandle"
                  placeholder="@yourhandle"
                  value={formData.xHandle}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={errors.xHandle ? 'border-red-500' : ''}
                />
                {errors.xHandle && (
                  <p className="text-xs text-red-500">{errors.xHandle}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Your Twitter/X username to receive updates and participate in tasks
                </p>
              </div>

              {/* Telegram Handle */}
              <div className="space-y-2">
                <Label htmlFor="telegramHandle">
                  Telegram Handle or User ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="telegramHandle"
                  name="telegramHandle"
                  placeholder="@yourhandle or 123456789"
                  value={formData.telegramHandle}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={errors.telegramHandle ? 'border-red-500' : ''}
                />
                {errors.telegramHandle && (
                  <p className="text-xs text-red-500">{errors.telegramHandle}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Your Telegram username or numeric user ID for community participation
                </p>
              </div>

              <DialogFooter className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Registration'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          /* Success State */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20"
            >
              <Check className="h-8 w-8 text-green-500" />
            </motion.div>
            <h3 className="text-lg font-semibold">Registration Confirmed!</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              You are now eligible to claim SSTL tokens on TGE. Your information has been saved securely.
            </p>
            <div className="mt-6 space-y-2 text-left w-full bg-muted/50 p-4 rounded-lg text-xs">
              <p>
                <span className="font-semibold">Wallet:</span> {formData.walletAddress.slice(0, 10)}...
              </p>
              <p>
                <span className="font-semibold">X Handle:</span> {formData.xHandle}
              </p>
              <p>
                <span className="font-semibold">Telegram:</span> {formData.telegramHandle}
              </p>
            </div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}
