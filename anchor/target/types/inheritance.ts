/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/inheritance.json`.
 */
export type Inheritance = {
  "address": "CRpkPb9EwbMSvNiyiMD4nqAdGJZGwdcS69vBZq77VZUn",
  "metadata": {
    "name": "inheritance",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "executeTransfer",
      "discriminator": [
        233,
        126,
        160,
        184,
        235,
        206,
        31,
        119
      ],
      "accounts": [
        {
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "beneficiaryTokenAccount",
          "writable": true
        },
        {
          "name": "state",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  104,
                  101,
                  114,
                  105,
                  116,
                  97,
                  110,
                  99,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "state.owner",
                "account": "state"
              },
              {
                "kind": "account",
                "path": "userTokenAccount"
              }
            ]
          }
        },
        {
          "name": "beneficiary",
          "docs": [
            "The beneficiary who will receive the tokens"
          ],
          "signer": true
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "mint"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram"
        }
      ],
      "args": []
    },
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "state",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  104,
                  101,
                  114,
                  105,
                  116,
                  97,
                  110,
                  99,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "account",
                "path": "userTokenAccount"
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "beneficiary",
          "type": "pubkey"
        },
        {
          "name": "duration",
          "type": "i64"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "manualCheckin",
      "discriminator": [
        250,
        216,
        82,
        154,
        229,
        46,
        108,
        254
      ],
      "accounts": [
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "state"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "removeDelegation",
      "discriminator": [
        236,
        168,
        148,
        208,
        61,
        164,
        154,
        125
      ],
      "accounts": [
        {
          "name": "state",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  104,
                  101,
                  114,
                  105,
                  116,
                  97,
                  110,
                  99,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "account",
                "path": "userTokenAccount"
              }
            ]
          }
        },
        {
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "owner",
          "signer": true,
          "relations": [
            "state"
          ]
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": []
    },
    {
      "name": "updateDelegation",
      "discriminator": [
        87,
        91,
        130,
        42,
        18,
        37,
        155,
        70
      ],
      "accounts": [
        {
          "name": "state",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  104,
                  101,
                  114,
                  105,
                  116,
                  97,
                  110,
                  99,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "account",
                "path": "userTokenAccount"
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "state"
          ]
        },
        {
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateDuration",
      "discriminator": [
        69,
        126,
        172,
        250,
        164,
        14,
        10,
        161
      ],
      "accounts": [
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "owner",
          "signer": true,
          "relations": [
            "state"
          ]
        }
      ],
      "args": [
        {
          "name": "newDuration",
          "type": "i64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "state",
      "discriminator": [
        200,
        143,
        133,
        14,
        75,
        11,
        115,
        59
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "stillActive",
      "msg": "The user is still active"
    },
    {
      "code": 6001,
      "name": "invalidOwner",
      "msg": "Invalid owner for state account"
    },
    {
      "code": 6002,
      "name": "invalidTokenAccount",
      "msg": "invalid token account"
    }
  ],
  "types": [
    {
      "name": "state",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "beneficiary",
            "type": "pubkey"
          },
          {
            "name": "expiryTime",
            "type": "i64"
          },
          {
            "name": "duration",
            "type": "i64"
          },
          {
            "name": "delegatedAmount",
            "type": "u64"
          },
          {
            "name": "tokenAccount",
            "type": "pubkey"
          }
        ]
      }
    }
  ]
};
