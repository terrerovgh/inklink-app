// Validation utilities for authentication forms

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
  fullName: string
  userType: 'client' | 'artist' | 'studio'
  phone?: string
  location?: string
}

// Email validation
export function validateEmail(email: string): string | null {
  if (!email) return 'El email es requerido'
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return 'Por favor ingresa un email válido'
  }
  
  return null
}

// Password validation
export function validatePassword(password: string): string | null {
  if (!password) return 'La contraseña es requerida'
  
  if (password.length < 6) {
    return 'La contraseña debe tener al menos 6 caracteres'
  }
  
  // Check for at least one letter and one number
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  
  if (!hasLetter || !hasNumber) {
    return 'La contraseña debe contener al menos una letra y un número'
  }
  
  return null
}

// Confirm password validation
export function validateConfirmPassword(password: string, confirmPassword: string): string | null {
  if (!confirmPassword) return 'Confirma tu contraseña'
  
  if (password !== confirmPassword) {
    return 'Las contraseñas no coinciden'
  }
  
  return null
}

// Full name validation
export function validateFullName(fullName: string): string | null {
  if (!fullName) return 'El nombre completo es requerido'
  
  if (fullName.trim().length < 2) {
    return 'El nombre debe tener al menos 2 caracteres'
  }
  
  // Check for at least two words (first and last name)
  const words = fullName.trim().split(/\s+/)
  if (words.length < 2) {
    return 'Por favor ingresa tu nombre y apellido'
  }
  
  return null
}

// Phone validation (optional)
export function validatePhone(phone: string): string | null {
  if (!phone) return null // Phone is optional
  
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '')
  
  if (cleanPhone.length < 10) {
    return 'El teléfono debe tener al menos 10 dígitos'
  }
  
  return null
}

// User type validation
export function validateUserType(userType: string): string | null {
  const validTypes = ['client', 'artist', 'studio']
  
  if (!userType) return 'Selecciona un tipo de usuario'
  
  if (!validTypes.includes(userType)) {
    return 'Tipo de usuario inválido'
  }
  
  return null
}

// Login form validation
export function validateLoginForm(data: LoginFormData): ValidationResult {
  const errors: Record<string, string> = {}
  
  const emailError = validateEmail(data.email)
  if (emailError) errors.email = emailError
  
  const passwordError = validatePassword(data.password)
  if (passwordError) errors.password = passwordError
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Register form validation
export function validateRegisterForm(data: RegisterFormData): ValidationResult {
  const errors: Record<string, string> = {}
  
  const emailError = validateEmail(data.email)
  if (emailError) errors.email = emailError
  
  const passwordError = validatePassword(data.password)
  if (passwordError) errors.password = passwordError
  
  const confirmPasswordError = validateConfirmPassword(data.password, data.confirmPassword)
  if (confirmPasswordError) errors.confirmPassword = confirmPasswordError
  
  const fullNameError = validateFullName(data.fullName)
  if (fullNameError) errors.fullName = fullNameError
  
  const userTypeError = validateUserType(data.userType)
  if (userTypeError) errors.userType = userTypeError
  
  const phoneError = validatePhone(data.phone || '')
  if (phoneError) errors.phone = phoneError
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Real-time validation helper
export function validateField(fieldName: string, value: string, formData?: Partial<RegisterFormData>): string | null {
  switch (fieldName) {
    case 'email':
      return validateEmail(value)
    case 'password':
      return validatePassword(value)
    case 'confirmPassword':
      return formData?.password ? validateConfirmPassword(formData.password, value) : null
    case 'fullName':
      return validateFullName(value)
    case 'phone':
      return validatePhone(value)
    case 'userType':
      return validateUserType(value)
    default:
      return null
  }
}