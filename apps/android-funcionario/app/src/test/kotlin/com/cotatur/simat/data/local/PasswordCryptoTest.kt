package com.cotatur.simat.data.local

import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class PasswordCryptoTest {

    @Test
    fun hashPasswordConSalt_generaSaltsDistintosParaMismaClave() {
        val (hash1, salt1) = PasswordCrypto.hashPassword("MiClaveSegura#2026")
        val (hash2, salt2) = PasswordCrypto.hashPassword("MiClaveSegura#2026")

        assertNotEquals("El salt aleatorio debe ser único por hash", salt1, salt2)
        assertNotEquals("El hash derivado debe variar por salt", hash1, hash2)
        assertTrue(PasswordCrypto.verifyPassword("MiClaveSegura#2026", hash1, salt1))
        assertTrue(PasswordCrypto.verifyPassword("MiClaveSegura#2026", hash2, salt2))
        assertFalse(PasswordCrypto.verifyPassword("OtraClave", hash1, salt1))
    }

    @Test
    fun verifyPassword_rechazaEntradasVaciasOManipuladas() {
        val (hash, salt) = PasswordCrypto.hashPassword("ClaveValida123")
        assertFalse(PasswordCrypto.verifyPassword("", hash, salt))
        assertFalse(PasswordCrypto.verifyPassword("   ", hash, salt))
        assertFalse(PasswordCrypto.verifyPassword("ClaveValida123", "", salt))
        assertFalse(PasswordCrypto.verifyPassword("ClaveValida123", hash, "salt_invalido"))
    }
}
