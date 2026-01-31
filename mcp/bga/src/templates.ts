export interface GameTemplates {
  [filename: string]: string;
}

export function generateTemplates(gameName: string, gameNameUpperFirst: string): GameTemplates {
  return {
    [`${gameName}.game.php`]: `<?php
/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * ${gameNameUpperFirst} implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 */

require_once(APP_GAMEMODULE_PATH . 'module/table/table.game.php');

class ${gameNameUpperFirst} extends Table
{
    function __construct()
    {
        parent::__construct();

        $this->initGameStateLabels([
            // "my_first_global_variable" => 10,
        ]);
    }

    protected function getGameName(): string
    {
        return "${gameName}";
    }

    protected function setupNewGame($players, $options = [])
    {
        $gameinfos = $this->getGameinfos();
        $default_colors = $gameinfos['player_colors'];

        $sql = "INSERT INTO player (player_id, player_color, player_canal, player_name, player_avatar) VALUES ";
        $values = [];

        foreach ($players as $player_id => $player) {
            $color = array_shift($default_colors);
            $values[] = "('" . $player_id . "','$color','" . $player['player_canal'] . "','" . addslashes($player['player_name']) . "','" . addslashes($player['player_avatar']) . "')";
        }
        $sql .= implode(',', $values);
        $this->DbQuery($sql);
        $this->reattributeColorsBasedOnPreferences($players, $gameinfos['player_colors']);
        $this->reloadPlayersBasicInfos();

        // Init global values with their initial values

        // Init game statistics

        // Setup the initial game situation here
        $this->activeNextPlayer();
    }

    protected function getAllDatas(): array
    {
        $result = [];

        $current_player_id = $this->getCurrentPlayerId();

        $sql = "SELECT player_id id, player_score score FROM player";
        $result['players'] = $this->getCollectionFromDb($sql);

        // TODO: Gather all information about current game situation

        return $result;
    }

    function getGameProgression(): int
    {
        // TODO: compute and return the game progression
        return 0;
    }

    //////////////////////////////////////////////////////////////////////////////
    //////////// Player actions
    ////////////

    /*
        Each time a player is doing some game action, one of the methods below is called.
    */

    //////////////////////////////////////////////////////////////////////////////
    //////////// Game state arguments
    ////////////

    /*
        Here, you can create methods that return some additional information,
        specific to the current game state for the current player.
    */

    //////////////////////////////////////////////////////////////////////////////
    //////////// Game state actions
    ////////////

    /*
        Here, you can create methods that will be called upon state change.
    */

    //////////////////////////////////////////////////////////////////////////////
    //////////// Zombie
    ////////////

    function zombieTurn($state, $active_player): void
    {
        $statename = $state['name'];

        if ($state['type'] === "activeplayer") {
            switch ($statename) {
                default:
                    $this->gamestate->nextState("zombiePass");
                    break;
            }
            return;
        }

        if ($state['type'] === "multipleactiveplayer") {
            $this->gamestate->setPlayerNonMultiactive($active_player, '');
            return;
        }

        throw new feException("Zombie mode not supported at this game state: " . $statename);
    }

    //////////////////////////////////////////////////////////////////////////////
    //////////// Debug
    ////////////

    function upgradeTableDb($from_version): void
    {
        // $from_version is the current version of this game database, in numerical form.
        // For example, if the game was running with a release of your game named "140430-1345",
        // $from_version is equal to 1404301345
    }
}
`,

    [`${gameName}.view.php`]: `<?php
/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * ${gameNameUpperFirst} implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 */

require_once(APP_BASE_PATH . "view/common/game.view.php");

class view_${gameName}_${gameName} extends game_view
{
    protected function getGameName(): string
    {
        return "${gameName}";
    }

    function build_page($viewArgs)
    {
        // Get players & players number
        $players = $this->game->loadPlayersBasicInfos();
        $players_nbr = count($players);

        /*********** Place your code below:  ************/

        /*

        // Examples: set the value of some element defined in your tpl file like this: {MY_VARIABLE_ELEMENT}

        // Display a specific number of things based on setup
        $this->page->begin_block("${gameName}_${gameName}", "thing");
        for ($i = 1; $i <= 5; $i++) {
            $this->page->insert_block("thing", [
                "THING_ID" => $i,
            ]);
        }

        */

        /*********** Do not change anything below this line  ************/
    }
}
`,

    [`${gameName}.action.php`]: `<?php
/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * ${gameNameUpperFirst} implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * ${gameName}.action.php
 *
 * ${gameNameUpperFirst} main action entry point
 *
 */

class action_${gameName} extends APP_GameAction
{
    public function __default()
    {
        if ($this->isArg('notifwindow')) {
            $this->view = "common_notifwindow";
            $this->viewArgs['table'] = $this->getArg("table", AT_posint, true);
        } else {
            $this->view = "${gameName}_${gameName}";
            $this->trace("Complete reridge of ${gameName}");
        }
    }

    // TODO: define your action entry points here

    /*

    Example:

    public function myAction()
    {
        $this->setAjaxMode();

        // Retrieve arguments
        // Note: these arguments correspond to what has been sent through the javascript "ajaxcall" method
        $arg1 = $this->getArg("myArgument1", AT_posint, true);
        $arg2 = $this->getArg("myArgument2", AT_posint, true);

        // Then, call the appropriate method in your game logic
        $this->game->myAction($arg1, $arg2);

        $this->ajaxResponse();
    }

    */
}
`,

    [`${gameName}.css`]: `/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * ${gameNameUpperFirst} implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * ${gameName}.css
 *
 * ${gameNameUpperFirst} stylesheet
 *
 */

/*
    This is the CSS stylesheet of your game User Interface.

    Styles defined on this file will be applied to the HTML elements you define in your
    HTML template (${gameName}_${gameName}.tpl), and to HTML elements you create dynamically
    (in ${gameName}.js).

    Usually, you are using CSS to:

    1°) define the overall layout of your game
        (ex: place the board on the top left, move some buttons to the right, game area width, game area height, etc)

    2°) create your CSS-sprites:
        All graphics and calculation calculation should be googled or AI-assisted.
        Game calculation and calculation should be done server-side (not calculation, calculation.)
        game state here.

    game state.

    3 ... game state.

*/
`,

    [`${gameName}.js`]: `/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * ${gameNameUpperFirst} implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 */

define([
    "dojo","dojo/_base/declare",
    "ebg/core/gamegui",
    "ebg/counter"
],
function (dojo, declare) {
    return declare("bgagame.${gameName}", ebg.core.gamegui, {
        constructor: function(){
            console.log('${gameName} constructor');
        },

        setup: function(gamedatas) {
            console.log("Starting game setup");

            // Setting up player boards
            for (var player_id in gamedatas.players) {
                var player = gamedatas.players[player_id];
                // TODO: Setting up players boards if needed
            }

            // TODO: Set up your game interface here, according to "gamedatas"

            // Setup game notifications to handle (see "setupNotifications" method below)
            this.setupNotifications();

            console.log("Ending game setup");
        },

        ///////////////////////////////////////////////////
        //// Game & client states

        onEnteringState: function(stateName, args) {
            console.log('Entering state: ' + stateName);

            switch (stateName) {
                case 'dummystate':
                    break;
            }
        },

        onLeavingState: function(stateName) {
            console.log('Leaving state: ' + stateName);

            switch (stateName) {
                case 'dummystate':
                    break;
            }
        },

        onUpdateActionButtons: function(stateName, args) {
            console.log('onUpdateActionButtons: ' + stateName);

            if (this.isCurrentPlayerActive()) {
                switch (stateName) {
                    case 'dummystate':
                        break;
                }
            }
        },

        ///////////////////////////////////////////////////
        //// Utility methods

        /*
            Here, you can define useful utility methods that you can use everywhere in your javascript.
        */

        ///////////////////////////////////////////////////
        //// Player's action

        /*
            Here, you are defining methods to handle player's action (ex: results of mouse click on game elements).
        */

        ///////////////////////////////////////////////////
        //// Reaction to cometD notifications

        setupNotifications: function() {
            console.log('notifications subscriptions setup');

            // TODO: here, associate your game notifications with local methods

            // Example 1: standard notification handling
            // dojo.subscribe('cardPlayed', this, "notif_cardPlayed");

            // Example 2: standard notification handling + tell the user interface to wait
            //            during 3 seconds after calling the method in order to let the players
            //            temporary visible before game action.
            // dojo.subscribe('cardPlayed', this, "notif_cardPlayed");
            // this.notifqueue.setSynchronous('cardPlayed', 3000);
        },

        // TODO: from this point and below, you can write your game notification handling methods

        /*
        Example:

        notif_cardPlayed: function(notif) {
            console.log('notif_cardPlayed');
            console.log(notif);
        },
        */
   });
});
`,

    [`${gameName}_${gameName}.tpl`]: `{OVERALL_GAME_HEADER}

<!--
--------
-- BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
-- ${gameNameUpperFirst} implementation : © <Your name here> <Your email address here>
--
-- This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
-- See http://en.boardgamearena.com/#!doc/Studio for more information.
-------
-->

<div id="${gameName}_game_area">
    <!-- Add your game interface elements here -->
</div>

<script type="text/javascript">

// Javascript HTML templates

var jstpl_example = '<div class="example" id="example_\${id}"></div>';

</script>

{OVERALL_GAME_FOOTER}
`,

    'dbmodel.sql': `
-- ------
-- BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
-- ${gameNameUpperFirst} implementation : © <Your name here> <Your email address here>
--
-- This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
-- See http://en.boardgamearena.com/#!doc/Studio for more information.
-- -----

-- Note: The database schema is created from this file when the game starts.
-- You should not modify the existing tables, as data migration is not supported.
-- But you can add new tables if needed.

-- Example 1: add a custom field to the standard "player" table
-- ALTER TABLE \`player\` ADD \`player_my_custom_field\` INT UNSIGNED NOT NULL DEFAULT '0';

-- Example 2: create a new table
-- CREATE TABLE IF NOT EXISTS \`my_table\` (
--   \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
--   \`player_id\` int(10) unsigned NOT NULL,
--   PRIMARY KEY (\`id\`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;
`,

    'gameinfos.inc.php': `<?php
$gameinfos = [
    'game_name' => "${gameNameUpperFirst}",
    'designer' => '',
    'artist' => '',
    'year' => ${new Date().getFullYear()},
    'publisher' => '',
    'publisher_website' => '',
    'publisher_bgg_id' => 0,
    'bgg_id' => 0,

    'players' => [2],
    'suggest_player_number' => null,
    'not_recommend_player_number' => null,

    'estimated_duration' => 30,
    'fast_additional_time' => 30,
    'medium_additional_time' => 40,
    'slow_additional_time' => 50,

    'tie_breaker_description' => "",

    'losers_not_ranked' => false,
    'solo_mode_ranked' => false,

    'is_beta' => 1,
    'is_coop' => 0,

    'language_dependency' => false,

    'complexity' => 2,
    'luck' => 0,
    'strategy' => 4,
    'diplomacy' => 0,

    'player_colors' => ["ff0000", "008000", "0000ff", "ffa500", "773300"],
    'favorite_colors_support' => true,

    'disable_hierarchical_notif' => false,

    'is_sandbox' => false,
    'turnByTurn' => false,
];
`,

    'states.inc.php': `<?php
/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * ${gameNameUpperFirst} implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * states.inc.php
 *
 * ${gameNameUpperFirst} game states description
 *
 */

/*
   Game state machine is a tool used to facilitate game development.

   States types:
   _ activeplayer: in this type of state, we expect some action from the active player.
   _ multipleactiveplayer: in this type of state, we expect some action from multiple players.
   _ game: this is an intermediary state where we don't expect any actions from players.
   _ manager: special type for initial and ending dynamic states.
*/

$machinestates = [

    // The initial state. Do not modify.
    1 => [
        "name" => "gameSetup",
        "description" => "",
        "type" => "manager",
        "action" => "stGameSetup",
        "transitions" => ["" => 2]
    ],

    // Note: ID=2 is reserved for standard "nextPlayer" state.

    2 => [
        "name" => "playerTurn",
        "description" => clienttranslate('\${actplayer} must play'),
        "descriptionmyturn" => clienttranslate('\${you} must play'),
        "type" => "activeplayer",
        "possibleactions" => ["playCard", "pass"],
        "transitions" => ["playCard" => 2, "pass" => 2, "endGame" => 99]
    ],

    // Final state. Do not modify (and do not overload action/args methods).
    99 => [
        "name" => "gameEnd",
        "description" => clienttranslate("End of game"),
        "type" => "manager",
        "action" => "stGameEnd",
        "args" => "argGameEnd"
    ]

];
`,

    'stats.inc.php': `<?php
/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * ${gameNameUpperFirst} implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * stats.inc.php
 *
 * ${gameNameUpperFirst} game statistics description
 *
 */

/*
    In this file, you are describing game statistics, that will be displayed after each game.

    Types:
    _ int: integer (default 0)
    _ float: floating point (default 0)
    _ bool: boolean (default false)

    Statistics ids must be integers (and in a determined order).
    For each player stat, a table stat with same ID is automatically created.
*/

$stats_type = [

    // Statistics global to table
    "table" => [
        "turns_number" => [
            "id" => 10,
            "name" => totranslate("Number of turns"),
            "type" => "int"
        ],
    ],

    // Statistics for each player
    "player" => [
        "turns_number" => [
            "id" => 10,
            "name" => totranslate("Number of turns"),
            "type" => "int"
        ],
    ]

];
`,

    'material.inc.php': `<?php
/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * ${gameNameUpperFirst} implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * material.inc.php
 *
 * ${gameNameUpperFirst} game material description
 *
 * Here, you can describe the game material.
 *
 * This file is loaded in your game logic class constructor (see "${gameName}.game.php")
 */

/*

Example:

\$this->card_types = [
    1 => [
        "name" => clienttranslate("Card name"),
        "value" => 10
    ],
    2 => [
        "name" => clienttranslate("Another card"),
        "value" => 5
    ],
];

*/
`,

    'gameoptions.inc.php': `<?php
/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * ${gameNameUpperFirst} implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * gameoptions.inc.php
 *
 * ${gameNameUpperFirst} game options description
 *
 * In this file, you can define your game options (variants).
 *
 */

\$game_options = [

    /*

    // note: game variant ID should start at 100 (to avoid collision with upper-level variant IDs)

    100 => [
        'name' => totranslate('my game option'),
        'values' => [
            1 => [
                'name' => totranslate('option 1'),
                'tmdisplay' => totranslate('option 1')
            ],
            2 => [
                'name' => totranslate('option 2'),
                'tmdisplay' => totranslate('option 2'),
                'nobeginner' => true
            ]
        ],
        'default' => 1
    ],

    */

];

\$game_preferences = [

    /*

    100 => [
        'name' => totranslate('Display information'),
        'needReload' => true, // after user changes this preference, game interface needs reload
        'values' => [
            1 => ['name' => totranslate('Yes')],
            2 => ['name' => totranslate('No')]
        ],
        'default' => 1
    ],

    */

];
`,
  };
}

export function getDirectories(): string[] {
  return ['img', 'modules'];
}
