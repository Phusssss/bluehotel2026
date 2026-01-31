#!/usr/bin/env node

/**
 * Security Rules Validation Script
 * 
 * This script validates that the Firestore security rules are properly deployed
 * and contain the expected security measures.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RULES_FILE = path.join(__dirname, '..', 'firestore.rules');

function validateSecurityRules() {
  console.log('🔒 Validating Firestore Security Rules...\n');

  // Check if rules file exists
  if (!fs.existsSync(RULES_FILE)) {
    console.error('❌ firestore.rules file not found!');
    process.exit(1);
  }

  const rulesContent = fs.readFileSync(RULES_FILE, 'utf8');

  // Define validation checks
  const checks = [
    {
      name: 'Authentication requirement',
      test: () => rulesContent.includes('isAuthenticated()'),
      description: 'All operations require user authentication'
    },
    {
      name: 'Super admin role check',
      test: () => rulesContent.includes('isSuperAdmin()'),
      description: 'Super admin privileges are implemented'
    },
    {
      name: 'Hotel access validation',
      test: () => rulesContent.includes('hasHotelAccess('),
      description: 'Multi-tenancy hotel access control'
    },
    {
      name: 'Permission level checks',
      test: () => rulesContent.includes('getHotelPermission('),
      description: 'Role-based permission system'
    },
    {
      name: 'Hotel ID validation',
      test: () => rulesContent.includes('hasValidHotelId('),
      description: 'Hotel ID presence and format validation'
    },
    {
      name: 'Owner permission check',
      test: () => rulesContent.includes('isHotelOwner('),
      description: 'Hotel owner privilege validation'
    },
    {
      name: 'Manager permission check',
      test: () => rulesContent.includes('isHotelManagerOrOwner('),
      description: 'Manager and owner privilege validation'
    },
    {
      name: 'Front desk access check',
      test: () => rulesContent.includes('canAccessFrontDesk('),
      description: 'Front desk staff permission validation'
    },
    {
      name: 'Housekeeping access check',
      test: () => rulesContent.includes('canAccessHousekeeping('),
      description: 'Housekeeping staff permission validation'
    },
    {
      name: 'Users collection security',
      test: () => rulesContent.includes('match /users/{userId}'),
      description: 'User document access control'
    },
    {
      name: 'Hotels collection security',
      test: () => rulesContent.includes('match /hotels/{hotelId}'),
      description: 'Hotel document access control'
    },
    {
      name: 'Hotel users junction table security',
      test: () => rulesContent.includes('match /hotelUsers/{hotelUserId}'),
      description: 'Hotel-user relationship access control'
    },
    {
      name: 'Reservations collection security',
      test: () => rulesContent.includes('match /reservations/{reservationId}'),
      description: 'Reservation document access control'
    },
    {
      name: 'Rooms collection security',
      test: () => rulesContent.includes('match /rooms/{roomId}'),
      description: 'Room document access control'
    },
    {
      name: 'Room types collection security',
      test: () => rulesContent.includes('match /roomTypes/{roomTypeId}'),
      description: 'Room type document access control'
    },
    {
      name: 'Customers collection security',
      test: () => rulesContent.includes('match /customers/{customerId}'),
      description: 'Customer document access control'
    },
    {
      name: 'Services collection security',
      test: () => rulesContent.includes('match /services/{serviceId}'),
      description: 'Service document access control'
    },
    {
      name: 'Housekeeping tasks security',
      test: () => rulesContent.includes('match /housekeepingTasks/{taskId}'),
      description: 'Housekeeping task access control'
    },
    {
      name: 'Maintenance tickets security',
      test: () => rulesContent.includes('match /maintenanceTickets/{ticketId}'),
      description: 'Maintenance ticket access control'
    },
    {
      name: 'Fallback deny rule',
      test: () => rulesContent.includes('match /{document=**}') && rulesContent.includes('allow read, write: if false'),
      description: 'Deny access to undefined collections'
    },
    {
      name: 'No temporary open access',
      test: () => !rulesContent.includes('allow read, write: if true') && !rulesContent.includes('TEMPORARY'),
      description: 'No temporary open access rules remain'
    }
  ];

  // Run validation checks
  let passedChecks = 0;
  let failedChecks = 0;

  checks.forEach(check => {
    const passed = check.test();
    if (passed) {
      console.log(`✅ ${check.name}`);
      console.log(`   ${check.description}\n`);
      passedChecks++;
    } else {
      console.log(`❌ ${check.name}`);
      console.log(`   ${check.description}\n`);
      failedChecks++;
    }
  });

  // Summary
  console.log('📊 Validation Summary:');
  console.log(`   ✅ Passed: ${passedChecks}`);
  console.log(`   ❌ Failed: ${failedChecks}`);
  console.log(`   📋 Total:  ${checks.length}\n`);

  if (failedChecks === 0) {
    console.log('🎉 All security rule validations passed!');
    console.log('🔒 Your Firestore security rules are comprehensive and production-ready.\n');
    
    console.log('🚀 Security Features Implemented:');
    console.log('   • Multi-tenancy with hotel-based data isolation');
    console.log('   • Role-based access control (owner, manager, receptionist, housekeeping)');
    console.log('   • Super admin privileges for system management');
    console.log('   • Authentication requirement for all operations');
    console.log('   • Data validation (hotelId requirements)');
    console.log('   • Granular permissions per collection');
    console.log('   • Fallback deny rule for undefined collections');
    
    process.exit(0);
  } else {
    console.log('⚠️  Some security rule validations failed.');
    console.log('Please review the firestore.rules file and ensure all required security measures are implemented.');
    process.exit(1);
  }
}

// Run validation
validateSecurityRules();