DROP TABLE IF EXISTS temp_workflows;
CREATE TABLE temp_workflows
(
  id                        BIGINT NOT NULL,
  kind                      INT NOT NULL,
  client_id                 INT,
  unique_hash               VARCHAR(255),
  status                    INT,
  created_at                timestamp NOT NULL,
  updated_at                timestamp NOT NULL
);

DROP TABLE IF EXISTS workflows;
CREATE TABLE workflows
(
  id                        BIGINT NOT NULL,
  kind                      INT NOT NULL,
  client_id                 INT,
  unique_hash               VARCHAR(255),
  status                    INT,
  created_at                timestamp NOT NULL,
  updated_at                timestamp NOT NULL
);

DROP TABLE IF EXISTS temp_workflow_steps;
CREATE TABLE temp_workflow_steps
(
  id                        BIGINT NOT NULL,
  workflow_id               BIGINT,
  kind                      INT NOT NULL,
  transaction_hash          VARCHAR(255),
  status                    INT,
  unique_hash               VARCHAR(255),
  created_at                timestamp NOT NULL,
  updated_at                timestamp NOT NULL
);

DROP TABLE IF EXISTS workflow_steps;
CREATE TABLE workflow_steps
(
  id                        BIGINT NOT NULL,
  workflow_id               BIGINT,
  kind                      INT NOT NULL,
  transaction_hash          VARCHAR(255),
  status                    INT,
  unique_hash               VARCHAR(255),
  created_at                timestamp NOT NULL,
  updated_at                timestamp NOT NULL
);

DROP TABLE IF EXISTS temp_chain_addresses;
CREATE TABLE temp_chain_addresses
(
  id                        BIGINT NOT NULL,
  associated_aux_chain_id   INT NOT NULL,
  kind                      INT NOT NULL,
  address                   VARCHAR(255) NOT NULL,
  known_address_id          INT,
  deployed_chain_id         INT,
  deployed_chain_kind       INT,
  status                    INT NOT NULL,
  created_at                timestamp NOT NULL,
  updated_at                timestamp NOT NULL
);

DROP TABLE IF EXISTS chain_addresses;
CREATE TABLE chain_addresses
(
  id                        BIGINT NOT NULL,
  associated_aux_chain_id   INT NOT NULL,
  kind                      INT NOT NULL,
  address                   VARCHAR(255) NOT NULL,
  known_address_id          INT,
  deployed_chain_id         INT,
  deployed_chain_kind       INT,
  status                    INT NOT NULL,
  created_at                timestamp NOT NULL,
  updated_at                timestamp NOT NULL
);

DROP TABLE IF EXISTS temp_token_addresses;
CREATE TABLE temp_token_addresses
(
  id                        BIGINT NOT NULL,
  token_id                  INT NOT NULL,
  kind                      INT NOT NULL,
  address                   VARCHAR(255) NOT NULL,
  deployed_chain_id         INT,
  deployed_chain_kind       INT,
  status                    INT NOT NULL,
  known_address_id          INT,
  created_at                timestamp NOT NULL,
  updated_at                timestamp NOT NULL
);

DROP TABLE IF EXISTS token_addresses;
CREATE TABLE token_addresses
(
  id                        BIGINT NOT NULL,
  token_id                  INT NOT NULL,
  kind                      INT NOT NULL,
  address                   VARCHAR(255) NOT NULL,
  deployed_chain_id         INT,
  deployed_chain_kind       INT,
  status                    INT NOT NULL,
  known_address_id          INT,
  created_at                timestamp NOT NULL,
  updated_at                timestamp NOT NULL
);

DROP TABLE IF EXISTS temp_staker_whitelisted_addresses;
CREATE TABLE temp_staker_whitelisted_addresses
(
  id                        BIGINT NOT NULL,
  token_id                  INT NOT NULL,
  staker_address            VARCHAR(255) NOT NULL,
  gateway_composer_address  VARCHAR(255) NOT NULL,
  status                    INT NOT NULL,
  created_at                timestamp NOT NULL,
  updated_at                timestamp NOT NULL
);

DROP TABLE IF EXISTS staker_whitelisted_addresses;
CREATE TABLE staker_whitelisted_addresses
(
  id                        BIGINT NOT NULL,
  token_id                  INT NOT NULL,
  staker_address            VARCHAR(255) NOT NULL,
  gateway_composer_address  VARCHAR(255) NOT NULL,
  status                    INT NOT NULL,
  created_at                timestamp NOT NULL,
  updated_at                timestamp NOT NULL
);
COMMIT;
