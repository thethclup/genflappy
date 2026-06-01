import genlayer as gl
from genlayer import DynArray, TreeMap, u256

class GenFlappy(gl.Contract):
    # Player stats
    player_best_score: TreeMap[str, u256]
    player_total_games: TreeMap[str, u256]
    player_total_pipes: TreeMap[str, u256]
    player_last_report: TreeMap[str, str]
    player_last_theme: TreeMap[str, str]
    player_last_verdict: TreeMap[str, str]

    # Active game sessions: player address -> game_id
    player_active_game: TreeMap[str, u256]

    # Game session data (stored by game_id as string key)
    game_player: TreeMap[str, str]
    game_theme: TreeMap[str, str]
    game_score: TreeMap[str, u256]
    game_checkpoint_count: TreeMap[str, u256]
    game_status: TreeMap[str, str]

    # Leaderboard (parallel arrays, max 10)
    lb_addresses: DynArray[str]
    lb_scores: DynArray[u256]
    lb_verdicts: DynArray[str]

    # Global counters
    game_counter: u256
    total_tx_count: u256

    def __init__(self) -> None:
        self.game_counter = u256(0)
        self.total_tx_count = u256(0)

    @gl.public.write
    def start_game(self, player: str) -> str:
        self.game_counter += u256(1)
        self.total_tx_count += u256(1)
        
        game_id = str(self.game_counter)
        self.game_player[game_id] = player
        self.game_score[game_id] = u256(0)
        self.game_checkpoint_count[game_id] = u256(0)
        self.game_status[game_id] = "active"
        
        self.player_active_game[player] = self.game_counter
        
        def leader_fn():
            prompt = """You are a creative narrator for GenFlappy, a blockchain validator game.
Generate a unique flight theme for a new game session.
The theme MUST reference one of these blockchain concepts:
zero knowledge proofs, optimistic rollups, MEV bots, validator slashing,
gas wars, consensus rounds, layer 2 bridges, DAO governance,
proof of stake, mempool chaos, block finality, sybil attacks.
Write EXACTLY ONE sentence. Maximum 15 words.
Make it dramatic and funny, like an epic journey announcement.
Example: "Today you fly through the MEV Mempool — where bots eat validators for breakfast."
Respond with the sentence only. No quotes. No extra text."""
            return gl.nondet.exec_prompt(prompt).strip()

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            result = leader_result.calldata
            return isinstance(result, str) and len(result.strip()) > 0

        theme = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        
        self.game_theme[game_id] = theme
        self.player_last_theme[player] = theme
        return theme

    @gl.public.write
    def submit_checkpoint(self, player: str, current_score: u256, checkpoint_id: u256) -> str:
        self.total_tx_count += u256(1)
        game_id_num = self.player_active_game.get(player, u256(0))
        game_id = str(game_id_num)
        
        if self.game_status.get(game_id, "") != "active":
            return "NO_ACTIVE_GAME"
            
        count = self.game_checkpoint_count.get(game_id, u256(0))
        self.game_checkpoint_count[game_id] = count + u256(1)
        
        def leader_fn():
            prompt = """You are a ruthless judge in the GenFlappy Validator Games.
A Validator Bird is at score """ + str(current_score) + """ and requesting a mid-flight boost.
Return your response as a JSON object with EXACTLY these keys:
"verdict": "boost" or "penalty"
"amount": (a whole number between 5 and 25)
"reason": (one sentence, funny, blockchain-themed, max 20 words)

Rules for your decision:
- If score is below 20: give penalty 70% of the time (bird is struggling)
- If score is 20-50: give boost 50% of the time (balanced)
- If score is above 50: give boost 70% of the time (bird is doing well)
- Reference gas fees, validators, MEV bots, or consensus in the REASON
- Be dramatic but follow the format exactly"""
            return gl.nondet.exec_prompt(prompt, response_format='json')

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            data = leader_result.calldata
            return (
                isinstance(data, dict)
                and data.get("verdict") in ("boost", "penalty")
                and isinstance(data.get("amount"), int)
                and 5 <= data["amount"] <= 25
                and isinstance(data.get("reason"), str)
            )

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        return "VERDICT: " + str(result['verdict']) + "\nAMOUNT: " + str(result['amount']) + "\nREASON: " + str(result['reason'])

    @gl.public.write
    def submit_score(self, player: str, score: u256, pipes_passed: u256, flight_seconds: u256) -> str:
        self.total_tx_count += u256(1)
        game_id_num = self.player_active_game.get(player, u256(0))
        game_id = str(game_id_num)
        
        self.game_status[game_id] = "finished"
        
        games = self.player_total_games.get(player, u256(0))
        self.player_total_games[player] = games + u256(1)
        
        pipes = self.player_total_pipes.get(player, u256(0))
        self.player_total_pipes[player] = pipes + pipes_passed
        
        best = self.player_best_score.get(player, u256(0))
        is_new_best = score > best
        if is_new_best:
            self.player_best_score[player] = score
            
        theme = self.player_last_theme.get(player, "the blockchain void")
        new_best_str = "YES" if is_new_best else "NO"
        
        def leader_fn():
            prompt = """You are a legendary blockchain historian writing post-flight reports for GenFlappy.
A Validator Bird just crashed. Stats:
Score: """ + str(score) + """
Pipes passed: """ + str(pipes_passed) + """
Flight duration: """ + str(flight_seconds) + """ seconds
Flight theme: """ + theme + """
New personal best: """ + new_best_str + """

Write a dramatic, poetic, funny flight report in exactly 2 sentences.
Reference the flight theme and blockchain concepts naturally.
Choose the verdict from EXACTLY this list based on the score:
- Score 0 to 9: DISASTROUS
- Score 10 to 24: ROOKIE
- Score 25 to 49: DECENT
- Score 50 to 99: EPIC
- Score 100 or above: LEGENDARY
You may override the verdict by one level up if it was a new personal best.

Return your response in JSON format with exactly two keys: "report" (the 2 sentences) and "verdict" (the single chosen word)."""
            return gl.nondet.exec_prompt(prompt, response_format='json')

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            data = leader_result.calldata
            if not isinstance(data, dict):
                return False
            verdict = data.get("verdict")
            valid_verdicts = ["LEGENDARY", "EPIC", "DECENT", "ROOKIE", "DISASTROUS"]
            return (
                isinstance(data.get("report"), str)
                and verdict in valid_verdicts
            )

        response = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        
        verdict = response.get("verdict", "")
        report_body = response.get("report", "")
        
        valid_verdicts = ["LEGENDARY", "EPIC", "DECENT", "ROOKIE", "DISASTROUS"]
        if verdict not in valid_verdicts:
            if score >= u256(100):
                verdict = "LEGENDARY"
            elif score >= u256(50):
                verdict = "EPIC"
            elif score >= u256(25):
                verdict = "DECENT"
            elif score >= u256(10):
                verdict = "ROOKIE"
            else:
                verdict = "DISASTROUS"
                
        self.player_last_report[player] = report_body
        self.player_last_verdict[player] = verdict
        
        if is_new_best:
            self._update_leaderboard(player, score, verdict)
            
        return report_body + "\nVERDICT: " + verdict

    @gl.public.view
    def get_flight_report(self, player: str) -> str:
        report = self.player_last_report.get(player, "No flights recorded yet.")
        verdict = self.player_last_verdict.get(player, "UNRANKED")
        return report + "\nVERDICT: " + verdict

    @gl.public.view
    def get_leaderboard(self) -> str:
        res = "["
        idx = 0
        while idx < len(self.lb_addresses):
            addr = self.lb_addresses[idx]
            score = self.lb_scores[idx]
            verdict = self.lb_verdicts[idx]
            
            addr_escaped = addr.replace('"', '\\"')
            verdict_escaped = verdict.replace('"', '\\"')
            
            res += '{"rank":' + str(idx + 1) + ',"address":"' + addr_escaped + '","score":' + str(score) + ',"verdict":"' + verdict_escaped + '"}'
            idx += 1
            if idx < len(self.lb_addresses):
                res += ","
        res += "]"
        return res

    @gl.public.view
    def get_player_stats(self, player: str) -> str:
        best = self.player_best_score.get(player, u256(0))
        games = self.player_total_games.get(player, u256(0))
        pipes = self.player_total_pipes.get(player, u256(0))
        theme = self.player_last_theme.get(player, "")
        report = self.player_last_report.get(player, "")
        verdict = self.player_last_verdict.get(player, "")
        
        theme_escaped = theme.replace('"', '\\"')
        report_escaped = report.replace('"', '\\"')
        verdict_escaped = verdict.replace('"', '\\"')
        
        return '{"address":"' + player + '","best_score":' + str(best) + ',"total_games":' + str(games) + ',"total_pipes":' + str(pipes) + ',"last_theme":"' + theme_escaped + '","last_report":"' + report_escaped + '","last_verdict":"' + verdict_escaped + '"}'

    @gl.public.view
    def get_total_games(self) -> u256:
        return self.game_counter

    def _update_leaderboard(self, player: str, score: u256, verdict: str) -> None:
        idx = 0
        found = -1
        while idx < len(self.lb_addresses):
            if self.lb_addresses[idx] == player:
                found = idx
            idx += 1
            
        if found != -1:
            i = found
            while i < len(self.lb_addresses) - 1:
                self.lb_addresses[i] = self.lb_addresses[i + 1]
                self.lb_scores[i] = self.lb_scores[i + 1]
                self.lb_verdicts[i] = self.lb_verdicts[i + 1]
                i += 1
            self.lb_addresses.pop()
            self.lb_scores.pop()
            self.lb_verdicts.pop()
            
        idx = 0
        inserted = False
        while idx < len(self.lb_scores):
            if score > self.lb_scores[idx]:
                self.lb_addresses.append("")
                self.lb_scores.append(u256(0))
                self.lb_verdicts.append("")
                i = len(self.lb_addresses) - 1
                while i > idx:
                    self.lb_addresses[i] = self.lb_addresses[i - 1]
                    self.lb_scores[i] = self.lb_scores[i - 1]
                    self.lb_verdicts[i] = self.lb_verdicts[i - 1]
                    i -= 1
                self.lb_addresses[idx] = player
                self.lb_scores[idx] = score
                self.lb_verdicts[idx] = verdict
                inserted = True
                break
            idx += 1
            
        if not inserted and len(self.lb_addresses) < 10:
            self.lb_addresses.append(player)
            self.lb_scores.append(score)
            self.lb_verdicts.append(verdict)
            
        while len(self.lb_addresses) > 10:
            self.lb_addresses.pop()
            self.lb_scores.pop()
            self.lb_verdicts.pop()
