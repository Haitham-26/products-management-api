type KeyTree<T> = {
  [K in keyof T]: T[K] extends string ? string : KeyTree<T[K]>;
};

const LEAF = "" as const;

const buildKeys = <T extends Record<string, any>>(
  schema: T,
  prefix = "",
): KeyTree<T> => {
  const result = {} as any;

  for (const key of Object.keys(schema)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const value = schema[key];

    result[key] = value === LEAF ? path : buildKeys(value, path);
  }

  return result;
};

const APIErrorKeySchema = {
  internal: LEAF,
  unauthorized: LEAF,
  rateLimit: {
    global: LEAF,
  },
  organization: {
    inviteMembers: {
      emails: {
        invalid: LEAF,
        duplicate: LEAF,
        minLength: LEAF,
      },
      selfInvite: LEAF,
      invitees: {
        someInOrg: LEAF,
        someHavePending: LEAF,
      },
    },
    cancelInvitation: {
      notFound: LEAF,
      invalidId: LEAF,
      notPending: LEAF,
      expired: LEAF,
    },
    declineInvitation: {
      notFound: LEAF,
      invalidId: LEAF,
      notPending: LEAF,
      expired: LEAF,
    },
    acceptInvitation: {
      notFound: LEAF,
      invalidId: LEAF,
      notPending: LEAF,
      expired: LEAF,
    },
    leave: {
      notMember: LEAF,
    },
    removeMember: {
      invalidId: LEAF,
      notMember: LEAF,
    },
    managePermissions: {
      members: {
        invalidId: LEAF,
        notMember: LEAF,
        minLength: LEAF,
        permissions: {
          invalidType: LEAF,
        },
        someNotFound: LEAF,
      },
      self: LEAF,
    },
  },
  imageUpload: {
    invalidType: LEAF,
    limit: {
      size: LEAF,
      field: LEAF,
      count: LEAF,
    },
  },
  permissions: {
    orgOnly: LEAF,
    hasNoPermission: LEAF,
  },
  settings: {
    update: {
      inventory: {
        defaultMinStock: {
          invalid: LEAF,
          min: LEAF,
        },
      },
      currency: {
        invalid: LEAF,
      },
      lang: {
        invalid: LEAF,
      },
      notFound: LEAF,
    },
  },
  tags: {
    create: {
      name: {
        invalid: LEAF,
        short: LEAF,
        long: LEAF,
      },
      description: {
        invalid: LEAF,
        long: LEAF,
      },
    },
    update: {
      notFound: LEAF,
      invalidId: LEAF,
    },
    delete: {
      notFound: LEAF,
      invalidId: LEAF,
    },
    bulkDelete: {
      notFound: LEAF,
      invalidId: LEAF,
      minLength: LEAF,
    },
  },
  categories: {
    create: {
      name: {
        invalid: LEAF,
        short: LEAF,
        long: LEAF,
      },
      description: {
        invalid: LEAF,
        long: LEAF,
      },
    },
    update: {
      notFound: LEAF,
      invalidId: LEAF,
    },
    delete: {
      notFound: LEAF,
      invalidId: LEAF,
    },
    bulkDelete: {
      notFound: LEAF,
      invalidId: LEAF,
      minLength: LEAF,
    },
  },
  orders: {
    create: {
      customerName: {
        invalid: LEAF,
        short: LEAF,
        long: LEAF,
      },
      customerPhone: {
        invalid: LEAF,
      },
      customerEmail: {
        invalid: LEAF,
      },
      items: {
        invalidProductId: LEAF,
        quantity: {
          invalid: LEAF,
          min: LEAF,
        },
        minLength: LEAF,
        someNotFound: LEAF,
        insufficientStock: LEAF,
      },
      note: {
        invalid: LEAF,
        long: LEAF,
      },
    },
    update: {
      invalidIsArchived: LEAF,
      notFound: LEAF,
      cannotUpdateArchived: LEAF,
      cannotUpdateNonPending: LEAF,
    },
    bulkManageVisibility: {
      orderIds: {
        invalid: LEAF,
        minLength: LEAF,
      },
      visibility: {
        invalid: LEAF,
      },
      someNotFound: LEAF,
    },
    manageStatus: {
      invalidOrderId: LEAF,
      invalidStatus: LEAF,
      notFound: LEAF,
      cannotChangeConfirmed: LEAF,
      sameStatus: LEAF,
      canceledToConfirmed: LEAF,
      items: {
        insufficientStock: LEAF,
      },
    },
    bulkManageStatus: {
      orderIds: {
        invalid: LEAF,
        minLength: LEAF,
        someNotFound: LEAF,
      },
      invalidStatus: LEAF,
      items: {
        insufficientStock: LEAF,
      },
    },
  },
  products: {
    create: {
      name: {
        invalid: LEAF,
        short: LEAF,
        long: LEAF,
      },
      description: {
        invalid: LEAF,
        long: LEAF,
      },
      price: {
        invalid: LEAF,
        min: LEAF,
      },
      quantity: {
        invalid: LEAF,
        min: LEAF,
      },
      discount: {
        type: {
          invalid: LEAF,
        },
        value: {
          invalid: LEAF,
          min: LEAF,
        },
      },
      invalidCategoryId: LEAF,
      invalidTagId: LEAF,
      duplicateTags: LEAF,
      category: {
        notFound: LEAF,
      },
      tags: {
        someNotFound: LEAF,
      },
    },
    update: {
      invalidStatus: LEAF,
      invalidMainImage: LEAF,
      invalidGalleryImage: LEAF,
      notFound: LEAF,
      category: {
        notFound: LEAF,
      },
      tags: {
        notFound: LEAF,
      },
    },
    delete: {
      notFound: LEAF,
      invalidId: LEAF,
    },
    bulkDelete: {
      notFound: LEAF,
      invalidId: LEAF,
      minLength: LEAF,
    },
    bulkManageStatus: {
      productIds: {
        invalid: LEAF,
        minLength: LEAF,
        someNotFound: LEAF,
      },
      invalidStatus: LEAF,
    },
    manageStock: {
      stockChange: {
        invalid: LEAF,
        zero: LEAF,
      },
      invalidProductId: LEAF,
      notFound: LEAF,
      belowZero: LEAF,
    },
  },
  user: {
    get: {
      notFound: LEAF,
    },
    update: {
      avatar: {
        invalid: LEAF,
      },
    },
    changePassword: {
      differentMethod: LEAF,
      currentPassword: {
        incorrect: LEAF,
      },
      samePassword: LEAF,
    },
  },
  login: {
    email: {
      invalid: LEAF,
    },
    password: {
      invalid: LEAF,
      short: LEAF,
      long: LEAF,
      regex: LEAF,
      incorrect: LEAF,
    },
    differentMethod: LEAF,
    notFound: LEAF,
  },

  "google-login": {
    differentMethod: LEAF,
    notVerified: LEAF,
  },

  signup: {
    email: {
      name: { invalid: LEAF, short: LEAF, long: LEAF, regex: LEAF },
      company: { invalid: LEAF, long: LEAF },
      email: { invalid: LEAF },
      password: { invalid: LEAF, short: LEAF, long: LEAF, regex: LEAF },
      userExists: LEAF,
      notVerifiedExists: LEAF,
    },
    token: {
      token: { invalid: LEAF, length: LEAF, incorrect: LEAF, expired: LEAF },
      email: { invalid: LEAF },
      notFound: LEAF,
    },
  },

  refreshToken: {
    token: { invalid: LEAF },
  },

  forgotPassword: {
    email: {
      email: { invalid: LEAF },
      notFound: LEAF,
    },
    token: {
      token: {
        invalid: LEAF,
        length: LEAF,
        incorrect: LEAF,
        expired: LEAF,
        missing: LEAF,
      },
    },
    new: {
      newPassword: { invalid: LEAF, short: LEAF, long: LEAF, regex: LEAF },
      samePassword: LEAF,
    },
  },
} as const;

export const APIErrorKeys = buildKeys(
  APIErrorKeySchema,
  "serverErrors",
) as KeyTree<typeof APIErrorKeySchema>;
